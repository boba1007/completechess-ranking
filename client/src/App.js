import React from 'react';
import './App.css';
import Dropzone from 'react-dropzone'
import {Container, Paper, Button} from '@material-ui/core/';
import MaterialTable from 'material-table'

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: null,
            columns: [
                {title: 'USCF ID', field: 'USCF ID', editable: 'never'},
                {
                    title: 'Name',
                    field: 'Name',
                    render: rowData => <a href={`http://www.uschess.org/msa/MbrDtlMain.php?${rowData["USCF ID"]}`} target="_blank">{rowData["Name"]}</a>,
                },
                {
                    title: 'Grade',
                    field: 'Grade',
                    type: 'numeric',
                    render: rowData => <p>{rowData["Grade"]===99 ? 'N/A' : rowData["Grade"]}</p>,
                },
                {title: 'Gender', field: 'Gender'},
                {title: 'Last Event', field: 'Last Event'},
                {title: 'Regular Rating', field: 'Regular Rating', type: 'numeric', defaultSort: 'desc'},
            ],
            players: [],
            generated: false
        };
        this.createTables = this.createTables.bind(this);
        this.dropFile = this.dropFile.bind(this);
        this.saveData = this.saveData.bind(this);
        this.reloadData = this.reloadData.bind(this);
        this.createTables = this.createTables.bind(this);
    }

    dropFile(file) {
        let fileReader;
        let self = this;
        const handleFileRead = (e) => {
            const content = fileReader.result;
            this.setState({
                data: content
            });
            self.parsePlayers();
        };
        const handleFileChose = (file) => {
            fileReader = new FileReader();
            fileReader.onloadend = handleFileRead;
            fileReader.readAsText(file);
        };
        handleFileChose(file[0]);
    }

    parsePlayers() {
        let {data} = this.state;
        let playersList = [];
        let players = [];
        let lines = data.split('\n');
        let i, j, temp, chunk = 15;
        for (i = 0, j = lines.length; i < j; i += chunk) {
            temp = lines.slice(i, i + chunk);
            if (temp !== [""]) playersList.push(temp);
        }
        for (i = 0; i < playersList.length; i++) {
            players.push(this.getPlayer(playersList[i]));
        }
        this.setState({players})
    }

    getPlayer(data) {
        let i;
        let player = {};
        const convertToNum = (i) => {
            let res = i;
            if (res.indexOf('*') > 0) res = res.substring(0, res.indexOf('*'));
            if (res.indexOf('/') > 0) res = res.substring(0, res.indexOf('/'));
            return parseInt(res, 10);
        };
        for (i = 0; i < data.length - 1; i++) {
            let lines = data[i].split(':');
            if (lines[0] === "Regular Rating") {
                let num = convertToNum(lines[1]) || 0;
                player[lines[0]] = num;
            } else {
                player[lines[0]] = lines[1]
            }
        }
        return player;
    }

    createTables() {
        let {players} = this.state;
        if (players && players.length>0) {
            let topFemales, topK12, topK8, topGrade5, topGrade4, topGrade3, topGrade2, topGrade1;
            topFemales = players.filter(player => player["Gender"] && player["Gender"].trim() === "Female");
            topK12 = players.filter(player => player["Grade"] < 13 && player["Grade"] > 8);
            topK8 = players.filter(player => player["Grade"] < 9 && player["Grade"] > 5);
            topGrade5 = players.filter(player => player["Grade"] === 5);
            topGrade4 = players.filter(player => player["Grade"] === 4);
            topGrade3 = players.filter(player => player["Grade"] === 3);
            topGrade2 = players.filter(player => player["Grade"] === 2);
            topGrade1 = players.filter(player => player["Grade"] < 2);

            this.setState({
                generated: true,
                topFemales: topFemales,
                topK12: topK12,
                topK8: topK8,
                topGrade5: topGrade5,
                topGrade4: topGrade4,
                topGrade3: topGrade3,
                topGrade2: topGrade2,
                topGrade1: topGrade1
            })
        }
    }

    saveData() {
        let {players} = this.state;
        localStorage.setItem('ccPlayers', JSON.stringify(players));
    }

    reloadData() {
        let res;
        let tmp = localStorage.getItem("ccPlayers");
        if (tmp) {
            res = JSON.parse(tmp)
        }
        this.setState({
            players: res,
            generated: false
        })
    }

    render() {
        let {columns, players, generated, topFemales, topK12, topK8, topGrade5, topGrade4, topGrade3, topGrade2, topGrade1} = this.state;
        const editTable =
            <Paper>
                <MaterialTable
                    title="Edit Data"
                    columns={columns}
                    data={players}
                    options={{pageSize: 10}}
                    editable={{
                        onRowAdd: newData =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    players.push(newData);
                                    this.setState({players}, () => resolve());
                                    resolve()
                                }, 1000)
                            }),
                        onRowUpdate: (newData, oldData) =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    const players = this.state.players;
                                    const index = players.indexOf(oldData);
                                    players[index] = newData;
                                    this.setState({players}, () => resolve());
                                    resolve()
                                }, 1000)
                            }),
                        onRowDelete: oldData =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    const index = players.indexOf(oldData);
                                    players.splice(index, 1);
                                    this.setState({players}, () => resolve());
                                    resolve()
                                }, 1000)
                            }),
                    }}
                />
            </Paper>;
        const generatedTables =
            <Paper>
                <MaterialTable
                    title="Overall Ranking"
                    columns={columns}
                    data={players}
                    options={{
                        search: false,
                        pageSize: 10
                    }}
                />
                <MaterialTable
                    title="Top 10 Girls"
                    columns={columns}
                    data={topFemales}
                    options={{
                        search: false,
                        pageSize: 10
                    }}
                />
                <MaterialTable
                    title="Top Grades 9-12"
                    columns={columns}
                    data={topK12}
                    options={{
                        search: false,
                        pageSize: 10
                    }}
                />
                <MaterialTable
                    title="Top Grades 6-8"
                    columns={columns}
                    data={topK8}
                    options={{
                        search: false,
                        pageSize: 10
                    }}
                />
                <MaterialTable
                    title="Top Grade 5"
                    columns={columns}
                    data={topGrade5}
                    options={{
                        search: false,
                        pageSize: 10
                    }}
                />
                <MaterialTable
                    title="Top Grade 4"
                    columns={columns}
                    data={topGrade4}
                    options={{
                        search: false,
                        pageSize: 10
                    }}
                />
                <MaterialTable
                    title="Top Grade 3"
                    columns={columns}
                    data={topGrade3}
                    options={{
                        search: false,
                        pageSize: 10
                    }}
                />
                <MaterialTable
                    title="Top Grade 2"
                    columns={columns}
                    data={topGrade2}
                    options={{
                        search: false,
                        pageSize: 10
                    }}
                />
                <MaterialTable
                    title="Top K-1"
                    columns={columns}
                    data={topGrade1}
                    options={{
                        search: false,
                        pageSize: 10
                    }}
                />
            </Paper>;
        return (
            <div className="App">
                <Container className="drop-zone">
                    <Dropzone
                        accept={".txt"}
                        multiple={false}
                        onDrop={acceptedFiles => this.dropFile(acceptedFiles)}
                    >
                        {({getRootProps, getInputProps}) => (
                            <section>
                                <div {...getRootProps()}>
                                    <input {...getInputProps()} />
                                    <p>Drag & drop some files here, or click to select files</p>
                                </div>
                            </section>
                        )}
                    </Dropzone>
                    <Button onClick={this.saveData} variant="contained" className="cc-button">
                        Save Data
                    </Button>
                    <Button onClick={this.reloadData} variant="contained" color="primary" className="cc-button">
                        Reload Data
                    </Button>
                    <Button onClick={this.createTables} variant="contained" color="secondary" className="cc-button">
                        Generate Tables
                    </Button>
                </Container>
                {players.length > 0 ?
                    <Container>
                        {generated ? generatedTables : editTable}
                    </Container>
                    : null
                }
            </div>
        )
    }
}

export default App;
