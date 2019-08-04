const ipm2 = require('pm2-interface')();
const fs = require('fs');
const mows = require('../server');
const path = require('path');

const logsFile = path.normalize(`${__dirname}/../../../../../../../../.pm2/logs`);

const compareKey = function (data, key) {
    if (data.hasOwnProperty(key)) {
        const {
            value
        } = data[key];
        const dataObj = {
            value,
        };
        return dataObj;
    }
    return null;
};

const Client = function () {
    // const client = mows.createClient(3001, 'ws://18.204.31.162');
    const client = mows.createClient(3001, 'ws://18.204.31.162');

    client.on('message', function (topic, data) {
        if (topic === 'presence') {
            setInterval(function () {
                let allData = {};
                const processes = [];
                ipm2.rpc.getSystemData({}, function (err, systemData) {
                    if (err) {
                        console.log('err', err);
                    } else {
                        const {
                            hostname
                        } = systemData.system;
                        const {
                            total,
                            free,
                        } = systemData.system.memory;
                        const Memory = {
                            total_mem: total,
                            free_mem: free,
                        };

                        const getDataArr = systemData.processes;
                        let processObj = {};
                        for (let i = 0; i < getDataArr.length; i++) {
                            const {
                                name,
                                pm_id,
                            } = getDataArr[i];
                            const {
                                memory,
                                cpu,
                            } = getDataArr[i].monit;
                            const processMonit = {
                                memory,
                                cpu,
                            };
                            const pm2_env = getDataArr[i].pm2_env;
                            const {
                                restart_time,
                                username,
                                status,
                            } = pm2_env;
                            processObj = {
                                name,
                                pm_id,
                                restart_time,
                                username,
                                status,
                            };
                            if (pm2_env.axm_actions) {
                                processObj.axm_actions = pm2_env.axm_actions;
                            }
                            if (pm2_env.axm_monitor) {
                                const loopDel = compareKey(pm2_env.axm_monitor, 'Loop delay');
                                if (loopDel) {
                                    processObj.loopDelay = loopDel;
                                }

                                const activeReq = compareKey(pm2_env.axm_monitor, 'Active requests');
                                if (activeReq) {
                                    processObj.activeRequests = activeReq;
                                }

                                const activeHandeled = compareKey(pm2_env.axm_monitor, 'Active handles');
                                if (activeHandeled) {
                                    processObj.activeHandles = activeHandeled;
                                }

                                const varCount = compareKey(pm2_env.axm_monitor, 'Var count');
                                if (varCount) {
                                    processObj.varCount = varCount;
                                }

                                const reqMin = compareKey(pm2_env.axm_monitor, 'req/min');
                                if (reqMin) {
                                    processObj['req/min'] = reqMin;
                                }

                                const globalLogs = compareKey(pm2_env.axm_monitor, 'Global logs size');
                                if (globalLogs) {
                                    processObj['Global logs size'] = globalLogs;
                                }

                                const filesCount = compareKey(pm2_env.axm_monitor, 'Files count');
                                if (filesCount) {
                                    processObj['Files count'] = filesCount;
                                }
                            }
                            if (pm2_env.axm_monitor && pm2_env.axm_monitor.HTTP) {
                                const {
                                    value,
                                } = pm2_env.axm_monitor.HTTP;
                                const httpReq = {
                                    value,
                                };
                                processObj.HTTP = httpReq;
                            }
                            if (pm2_env.axm_monitor && pm2_env.axm_monitor.Downloads) {
                                const {
                                    value,
                                } = pm2_env.axm_monitor.Downloads;
                                const dLoad = {
                                    value,
                                };
                                processObj.Downloads = dLoad;
                            }
                            processObj.monit = processMonit;
                            processes.push(processObj);
                        }
                        allData = {
                            hostname,
                            Memory,
                            processes,
                        };
                        client.publish('data', JSON.stringify(allData));
                    }
                });
            }, 3000);
        }

        if (topic === 'startProcessId') {
            ipm2.rpc.startProcessId(data, function (err) {
                if (err) {
                    console.log('startProcessId', err);
                } else {
                    console.log(`Process have id ${data} started`);
                }
            });
        }

        if (topic === 'stopProcessId') {
            ipm2.rpc.stopProcessId(data, function (err) {
                if (err) {
                    console.log('err in stopProcessId', err);
                } else {
                    console.log(`Process have id ${data} stopped`);
                }
            });
        }

        if (topic === 'restartProcessId') {
            const obj = {
                id: data
            };
            ipm2.rpc.restartProcessId(obj, function (err) {
                if (err) {
                    console.log('err in restartProcessId', err);
                } else {
                    console.log(`Process have id ${data} restarted`);
                }
            });
        }

        if (topic === 'deleteProcessId') {
            ipm2.rpc.deleteProcessId(data, function (err) {
                if (err) {
                    console.log('err in deleteProcessId', err);
                } else {
                    console.log(`Process have id ${data} deleted`);
                }
            });
        }

        if (topic === 'checkLogs') {
            fs.readdir(logsFile, function (err, content) {
                if (err) {
                    console.log('err in read directory', err);
                } else {
                    content.forEach(function (fileName) {
                        const file = fileName.search(`${data}.log`);
                        if (file > -1) {
                            setInterval(function () {
                                let fileObj = {};
                                fs.readFile(`${logsFile}/${fileName}`, function (error, fileData) {
                                    if (err) {
                                        console.log('err in read file', error);
                                    } else {
                                        if (fileName.search(`error-${data}.log`)) {
                                            fileObj['error file'] = fileData.toString();
                                        }
                                        if (fileName.search(`out-${data}.log`)) {
                                            fileObj['data file'] = fileData.toString();
                                        }
                                    }
                                    fileObj = JSON.stringify(fileObj);
                                    client.publish('logs', `${fileObj}`);
                                });
                            }, 3000);
                        }
                    });
                }
            });
        }
    });
};

module.exports = {
    Client,
};