
var CapturingReality = CapturingReality || {};

(function( $cr ) {
    $cr.node = $cr.node || {};

    var _sessionToken = "";
    var _authToken = "";
    var _origin = window.location.origin;

    $cr.log = function( str ) {
        const logger = $('#logger');
        $('<span />', { 'class': 'logEntry' })
            .text(new Date().toLocaleTimeString() + ': ' + str)
            .add('<br />')
            .appendTo(logger);
        logger.animate( { scrollTop: logger.prop('scrollHeight')}, 'fast' );
    };

    $cr.getAjaxBaseSettings = function() {
        return {
            headers:
            {
                "Authorization": 'Bearer ' + _authToken,
                "Session": _sessionToken
            }
        };
    };

    $cr.getAjaxJsonSettings = function() {
        return Object.assign( {
            dataType: "json"
        }, $cr.getAjaxBaseSettings() );
    };

    $cr.node.activateToken = function( token ) {
        _authToken = token;
    }

    $cr.node.activateSession = function( token ) {
        if ( _sessionToken !== token && _sessionToken )
        {
            $cr.projectClose();
        }
        _sessionToken = token;
        $cr.log('Session change ' + token);
        $cr.sessionChange.fire( token );
    }

    $cr.sessionChange = $.Callbacks();
    $cr.onSessionChange = function( fn ) {
        $cr.sessionChange.add( fn );
        fn( _sessionToken );
    };

    $cr.node.setOrigin = function( origin ) {
        _origin = window.location.protocol.slice(0,-1) + origin;
    }

    function transformResolved( data, textStatus, jqXHR ) {
        return { response: data, textStatus: textStatus, jqXHR: jqXHR };
    }
    function transformFailed( jqXHR, textStatus, errorThrown ) {
        return { response: jqXHR.responseText, textStatus: textStatus, jqXHR: jqXHR, error: errorThrown };
    }

    $cr.node.call = function( path, settings ) {
        return $.ajax(_origin + path, settings )
        .done(function( data, textStatus, jqXHR ) {
            $cr.log( jqXHR.status + ' O ' + settings.method + ' ' + path + ' ' + JSON.stringify(data));
        })
        .fail(function( jqXHR, textStatus, errorThrown ) {
            $cr.log( jqXHR.status + ' F ' + settings.method + ' ' + path + ' ' + jqXHR.responseText);
        })
        .then(transformResolved, transformFailed);
    }

    $cr.callPost = function( path, settings ) {
        return $cr.node.call( path, { ...settings, method: "POST" });
    }

    $cr.callGet = function( path, settings ) {
        return $cr.node.call( path, { ...settings, method: "GET" });
    }

    $cr.nodeStatus = function() {
        return $cr.callGet("/node/status", $cr.getAjaxJsonSettings());
    }

    $cr.nodeConnection = function() {
        return $cr.callGet("/node/connection", $cr.getAjaxJsonSettings());
    }

    $cr.nodeProjects = function() {
        return $cr.callGet("/node/projects", $cr.getAjaxJsonSettings());
    }

    $cr.projectList = function( folder ) {
        return $cr.callGet("/project/list", { ...$cr.getAjaxJsonSettings(), data: { folder: folder }} );
    }

    $cr.projectSave = function( name ) {
        return $cr.callGet("/project/save", { ...$cr.getAjaxBaseSettings(), data: { name: name }});
    }

    $cr.projectDelete = function( guid ) {
        return $cr.callGet("/project/delete", { ...$cr.getAjaxBaseSettings(), data: { guid: guid }});
    }

    $cr.projectOpen = function( guid, name ) {
        return $cr.callGet("/project/open", { ...$cr.getAjaxBaseSettings(), data: { guid: guid, name: name }})
        .then(function( result ) {
            const session = result.jqXHR.getResponseHeader('Session');
            $cr.node.activateSession( session );
        });
    }

    $cr.projectCreate = function() {
        return $cr.callGet("/project/create", $cr.getAjaxBaseSettings()).then(function( result ) {
            const session = result.jqXHR.getResponseHeader('Session');
            $cr.node.activateSession( session );
        });
    }

    $cr.projectClose = function() {
        return $cr.callGet("/project/close", $cr.getAjaxBaseSettings());
    }

    $cr.projectStatus = function() {
        return $cr.callGet("/project/status", $cr.getAjaxJsonSettings());
    }
    
    const encodeGetParams = function (p) { 
        return Object.entries(p).map(kv => kv.map(encodeURIComponent).join("=")).join("&");
    }

    $cr.projectDownload = function( params ) {
        const dfd = $.Deferred();
        var req = new XMLHttpRequest();
        const requestUrl = '/project/download?' + encodeGetParams(params);

        if (params.name == null) {
            dfd.reject({ response: '', textStatus: 'Missing name parameter.', jqXHR: req, error: '' });
        } else {
            req.open('GET', _origin + requestUrl, true);
            req.responseType = 'blob';
            const headers = $cr.getAjaxBaseSettings().headers;
            $.each( headers, function ( key, val ) {
                req.setRequestHeader( key, val );
            });
            req.onerror = function (event) {
                dfd.reject({ response: '', textStatus: 'Network error.', jqXHR: req, error: '' });
            };
            req.onload = function (event) {
                if (Math.floor(req.status / 100) === 2) {
                    dfd.resolve({ response: req.response, textStatus: '', jqXHR: req })
                } else {
                    const reader = new FileReader();
                    reader.addEventListener('loadend', function () {
                        const json = JSON.parse(reader.result);
                        dfd.reject({ response: json, textStatus: reader.result, jqXHR: req, error: '' });
                    });
                    reader.readAsText(req.response, "utf-8");
                }
            };

            req.send();
        }
        dfd.then( function( res ) {
            $cr.log( res.jqXHR.status + ' O GET ' + requestUrl );
        }, function( res ) {
            $cr.log( res.jqXHR.status + ' F GET ' + requestUrl + ' ' + res.textStatus);
        });
        return dfd;
    }
    
    $cr.projectUpload = function( query, file ) {
        const settings = {
            ...$cr.getAjaxBaseSettings(),
            data: file,
            processData: false,
            contentType: 'application/octet-stream'
        };
        return $cr.callPost(
            "/project/upload?" + encodeGetParams(query),
            settings );
    }

    $cr.projectCommand = function( query, file ) {
        const withFile = !(file == null);
        const callFn = withFile ? $cr.callPost : $cr.callGet;
        var settings = $cr.getAjaxBaseSettings();
        if (withFile) {
            $.extend(settings, {
                data: file,
                processData: false,
                contentType: 'application/octet-stream'
            })
        }
        return callFn(
            "/project/command?" + encodeGetParams(query),
            settings );
    }

    return $cr;
})( CapturingReality );

(function() {
    const $cr = CapturingReality;
    
    function StartApp() {
        // Application code example
        const originParam = 'origin';
        const sessionParam = 'session';
        const tokenParam = 'authToken';
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has(originParam)) {
            $cr.node.setOrigin(urlParams.get(originParam));
        }
        if (urlParams.has(sessionParam)) {
            $cr.node.activateSession(urlParams.get(sessionParam));
        }
        if (urlParams.has(tokenParam)) {
            $cr.node.activateToken(urlParams.get(tokenParam));
        }

        var uploadPromise = $.Deferred();
        const sessionField = $('#sessionField');
        const nodeStatusButton = $('#nodeStatusButton');
        const nodeProjectsButton = $('#nodeProjectsButton');
        const projectCreateButton = $('#projectCreateButton');
        const projectListDataButton = $('#projectListDataButton');
        const projectListOutputsButton = $('#projectListOutputsButton');
        const projectOpenButton = $('#projectOpenButton');
        const projectSaveButton = $('#projectSaveButton');
        const projectCloseButton = $('#projectCloseButton');
        const projectDeleteButton = $('#projectDeleteButton');
        const projectStatusButton = $('#projectStatusButton');
        const projectNameField = $('#projectNameField');
        const projectCommandButton = $('#projectCommandButton');
        const projectCommandField = $('#projectCommandField');
        const projectDownloadButton = $('#projectDownloadButton');
        const projectDownloadField = $('#projectDownloadField');
        const projectForm = $('#projectForm');
        const uploadField = $('#uploadField');
        const projectUploadFilename = $('#projectUploadFilename');

        $cr.onSessionChange(function ( session ) {
            sessionField.val(session);
        });
        nodeStatusButton.on('click', function() {
            $cr.nodeStatus();
        });
        nodeProjectsButton.on('click', function() {
            $cr.nodeProjects();
        });
        projectCreateButton.on('click', function() {
            $cr.projectCreate();
        });
        projectListDataButton.on('click', function() {
            $cr.projectList('data');
        });
        projectListOutputsButton.on('click', function() {
            $cr.projectList('output');
        });
        const GetProjectGuid = function ( projectName ) {
            const dfd = $.Deferred();
            $cr.nodeProjects().then(function( res ) {
                const projects = $.grep( res.response, ( projectInfo ) => {
                    return projectInfo.name === projectName;
                });
                if ( projects.length > 0 ) {
                    dfd.resolve( projects[0].guid );
                } else {
                    $cr.log( `No project with name ${projectName}` )
                    dfd.reject( null );
                }
            });
            return dfd;
        }
        projectOpenButton.on('click', function() {
            const name = projectNameField.val();
            GetProjectGuid( projectNameField.val() )
            .then(function( guid ) {
                $cr.projectOpen( guid, name );
            })
        });
        projectDeleteButton.on('click', function() {
            GetProjectGuid( projectNameField.val() )
            .then(function( guid ) {
                $cr.projectDelete( guid );
            })
        });
        projectSaveButton.on('click', function() {
            $cr.projectSave( projectNameField.val() );
        });
        projectCloseButton.on('click', function() {
            $cr.node.activateSession('');
        });
        projectStatusButton.on('click', function() {
            $cr.projectStatus();
        });
        projectCommandButton.on('click', function() {
            const inStr = projectCommandField.val();
            const params = [ 'name', 'param1', 'param2', 'param3', 'param4', 'param5', 'param6', 'param7', 'param8', 'param9' ]
            const arr = $.map(inStr.split(';'), $.trim).slice(0, params.length);
            const data = {}
            $.map(arr, ( val, i ) => {
                data[ params[i] ] = val;
            });
            $cr.projectCommand( data );
        });
        projectDownloadButton.on('click', function() {
            const fileName = projectDownloadField.val();
            $cr.projectDownload({ name: fileName }).then(function( res ) {
                const blob = res.response;
                const req = res.jqXHR;
                const contentType = req.getResponseHeader("content-type");
                
                if (window.navigator.msSaveOrOpenBlob) {
                    // Internet Explorer
                    window.navigator.msSaveOrOpenBlob(new Blob([blob], { type: contentType }), fileName);
                } else {
                    var el = document.getElementById("downloader");
                    el.href = window.URL.createObjectURL(blob);
                    el.download = fileName;
                    el.click();
                }
            });
        });
        projectForm.on('submit', function( event ) {
            event.preventDefault();
            const files = Array.from(uploadField.prop('files'));
            var uploadPromises = [];

            files.sort((a, b) => {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                // names must be equal
                return 0;
            })
            $.each( files, (k, file) => {
                const filename = projectUploadFilename.val() || file.name;
                if (file.name.match(/.(jpg|jpeg|png|gif)$/i)) {
                    uploadPromises.push( $cr.projectCommand({ name: 'add', param1: filename }, file) );
                } else if (file.name.match(/.(zip)$/i)) {
                    uploadPromises.push( $cr.projectCommand({ name: 'addFolder', param1: filename }, file) )
                } else {
                    uploadPromises.push( $cr.projectUpload({ name: filename }, file) );
                }
            })

            $.when( uploadPromises ).done(function() {
                uploadPromise.resolve();
            });
        });
    }

    function CreateApp( module ) {
        const version = module.moduleRoot.startsWith('/') ? 'Offline' : 'Online';
        const appHtml =
        `
            <h1>${version} sample app</h1>
            <div id="logger">
            </div>
            <a id="downloader" style="display: none"></a>
            <div id="controls">
                <label>
                    Session <input id="sessionField" type="text" readonly/>
                </label><br />
                <button id="nodeStatusButton" type="button">Query Status</button>
                <button id="nodeProjectsButton" type="button">List Projects</button>
                <button id="projectCreateButton" type="button">Create Project</button>
                <br />

                <label>
                    Project Name <input id="projectNameField" type="text" />
                </label>
                <button id="projectOpenButton" type="button">Open Project</button>
                <button id="projectSaveButton" type="button">Save Project</button>
                <button id="projectCloseButton" type="button">Close Project</button>
                <button id="projectDeleteButton" type="button">Delete Project</button>
                <br />

                <button id="projectListDataButton" type="button">Project List Data</button>
                <button id="projectListOutputsButton" type="button">Project List Outputs</button>
                <button id="projectStatusButton" type="button">Project Status</button>
                <br />

                <label>
                    Command <input id="projectCommandField" type="text" />
                </label>
                <button id="projectCommandButton" type="button">Send</button>
                ( separate name and arguments by ';', eg. exportModel;Model 1;model_name.obj)
                <br />
                <label>
                    Download name <input id="projectDownloadField" type="text" />
                </label>
                <button id="projectDownloadButton" type="button">Download</button>
                <br />
                <form method="post" id="projectForm" enctype="multipart/form-data">
                    <label>
                        Filename <input id="projectUploadFilename" type="text" />
                    </label>
                    <br />
                    <label>
                        Upload <input type="file" id="uploadField" name="upload[]" multiple>
                    </label>
                    <button type="submit">Submit</button>
                </form>
            </div>
        `;
        const appWrapper = document.createElement('div');
        appWrapper.innerHTML = appHtml;

        const observer = new MutationObserver(function () {
            StartApp();
        });

        const appRoot = document.getElementById('appRoot');
        observer.observe(appRoot, { childList: true });

        appRoot.append(appWrapper);
    }

    const ThisModuleName = 'CapturingReality.SampleApp';
    CapturingReality.Bootloader.AddOnModuleLoad( ThisModuleName, function( module ) {
        console.info(`${ThisModuleName}: Loaded.`);
        $cr.Bootloader.OnDocumentReady(() => {
            CreateApp( module );
        });
        return Promise.resolve();
    });
}) ();