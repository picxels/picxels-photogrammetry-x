"use strict";

console.log('secondscreen_app.js');

var CapturingReality = CapturingReality || {};

(function( $cr, $win ) {

const ErrorCode = Object.freeze({
    AuthenticationError: { id: "errors.com.capturingreality.rcnode.authentication_error" },
    NoSession: { id: "errors.com.capturingreality.rcnode.no_session" },
});

var gNode = null;
var gProject = null;
var gVis = null;
var gState = null;
var gLog = null;
var gModalWindow = null;
var gProjectChange = new $cr.Rx.Subject();

class AppError extends Error {
    constructor({
        code = {},
        message = "Unknown error",
        data = {}} = {})
    {
        super(message);
        this.code = code;
        this.data = data;
    }
}

class ModalWindow {
    constructor({ bgTag, winTag }) {
        this.bgTag = bgTag;
        this.winTag = winTag;
    }

    Clear() {
        this.winTag.textContent = '';
    }

    ShowHtml({ tag }) {
        this.bgTag.style.display = "block";
        this.winTag.appendChild(tag);
    }

    Hide() {
        this.bgTag.style.display = "none";
        this.winTag.textContent = '';
    }
}

function Delay(delay, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value));
}

// localization
function GetProcessFlag(id) {
    // bits
    //   1 - attach percentage
    //   2 - color red
    switch (id) {
        case -1:
        {
            return 0;
        };
    }
    return 1;
}
function GetProcessName(id) {

    switch (id) {
        case -1:
            return 'Ready';
        case -2:
            return 'Uploading';
        case -3:
            return "Network Error";
        case 0x10001:
        case 0x10002:
        case 0x10006:
            return "Aligning Images";
        case 0x5050:
        case 0x5051:
        case 0x5052:
            return "Calculating Mesh";
        case 7:
        case 8:
            return "Creating Texture";
        case 11:
        case 44:
            return "Simplifying Mesh";
        case 0x5057:
            return "Fetching Data";
        case 0x5034:
            return "Loading Scene";
        case 0x5035:
            return "Saving Scene";
    }
    return 'Processing';
}

// semantics

function SetActiveProject({ project, sessionOwner = true }) {
    if ( gProject && ( gProject == project ) )
        return;

    if ( gProject && gProject.sessionOwner ) {
        gState.isActive = false;
        gProject.Close();
    }

    if (project) {
        project.sessionOwner = sessionOwner;
        console.info(`Changing active project to ${project.sessionToken}`);
    } else {
        console.info('Reset active project');
    }

    gProject = project;
    gProjectChange.next( gProject );
}

function InitializeNode() {

    const originParam = 'origin';
    const sessionParam = 'session';
    const tokenParam = 'authToken';

    const urlParams = new URLSearchParams($win.location.search);

    if (!urlParams.has(tokenParam)) {
        return Promise.reject( new AppError({ code: ErrorCode.AuthenticationError, message: "Missing RCNode Token" }) );
    }

    const nodeAddress = urlParams.get(originParam);
    const authToken = urlParams.get(tokenParam);
    gNode = new CapturingReality.RCNode.NodeConnection(authToken, gLog, nodeAddress);

    const sessionId = urlParams.get(sessionParam);
    if (sessionId == null) {
        SetActiveProject({ project: null });
        return Promise.reject( new AppError({ code: ErrorCode.NoSession, message: "No active session", data: { silent: true } }) );
    } else {
        return gNode.GetStatus()
        .catch((e) => {
            return Promise.reject( new AppError({ code: ErrorCode.AuthenticationError, message: "Invalid RCNode Token", data: { reason: e } }) );
        }).then(() => {
            return gNode.JoinSession(sessionId);
        }).then((project) => {
            SetActiveProject({ project, sessionOwner: false });
        });
    }
}

function InitializeStates() {
    const state = new Object();
    state.photoIndex = 0;
    state.updateFrequency = 1500;
    state.sceneInfo = null;
    state.lockRefresh = 0;
    state.fetching = false;
    state.fetchingScene = false;
    state.lastProgressId = -9999;
    state.localProgress = { processID: 0, progress: 0, total: 0, counter: 0, jobs: 0, pendingAlignment: 0 };
    state.isActive = true;

    // new-able
    state.changeCounter = 0;
    state.sceneUnit = 1;
    state.activeCameraSet = new Set();
    state.pendingAlignment = false;
    gState = state;
    return CapturingReality.ResultCode.Ok;
}

function InitializeRenderer() {
    var canvas = document.querySelector('#idSceneView');

    gVis = new CapturingReality.Vis.WebEngine(canvas);
    var res = gVis.Initialize(canvas);
    if (res == CapturingReality.ResultCode.Ok) {
        res = gVis.CreateDefaultScene([0.1, 0.1, 0.1], [1, 1, 1], /*{ lineCount: 10, step: 1, color: [0.3, 0.3, 0.3], zeroColor: [0, 0, 0]}*/ null);
    }
    if (res == CapturingReality.ResultCode.Ok) {

        gVis.toolManager.AddTool(new CapturingReality.Vis.Tools.RollViewCameraTool([0.2, 0.1], [50, 30]));
        gVis.toolManager.AddTool(new CapturingReality.Vis.Tools.PanViewCameraTool());
        gVis.toolManager.AddTool(new CapturingReality.Vis.Tools.DollyViewCameraTool());
        gVis.toolManager.AddTool(new CapturingReality.Vis.Tools.GotoCameraTool());

        //gVis.toolManager.AddTool(new CapturingReality.Vis.Tools.RotateViewCameraTool());
        gVis.toolManager.AddTool(new CapturingReality.Vis.Tools.PivotRotateViewCameraTool());
        gVis.toolManager.AddTool(new CapturingReality.Vis.Tools.PlacePivotTool());
        gVis.toolManager.AddTool(new CapturingReality.Vis.Tools.TouchViewCameraTool());
    }

    return res;
}

function Render(now) {

    gVis.Redraw(now);
    requestAnimationFrame(Render);
}

function ResetCameraHistory(state) {
    state.sceneUnit = 1;
    state.activeCameraSet = new Set();
}

function NewScene(state) {
    ResetCameraHistory(state);

    state.changeCounter = 0;
    state.pendingAlignment = false;

    gVis.scene.RemoveByName("pivot");
    gVis.scene.RemoveByName("PointDataNode");
    gVis.scene.RemoveByName("CameraDataNode");
    gVis.scene.RemoveByName("SceneStructure");
    gVis.scene.RemoveByName("SceneMotion");
    gVis.scene.RemoveByName("SceneMotionNew");

    gVis.renderContext.cameraNode.SetLookAt([30, 30, 30], [0, 0, 0], [0, 0, 1]);

    // add pivot
    var pivot = new CapturingReality.Vis.SceneGraph.MetadataSceneNode("pivot");
    gVis.scene.Add(pivot);
    pivot.position = [0, 0, 0];

    return CapturingReality.ResultCode.Ok;
}

function StartLookAtAnimation(viewInfo) {

    var duration = 0.5;
    var animStart = gVis.renderContext.now;

    var cameraAnim = new CapturingReality.Vis.Animation.GroupAnimation("cameraAnimation");

    var zoomAnim = new CapturingReality.Vis.Animation.SetCameraZoomAnimation(
        new CapturingReality.Vis.Animation.EaseChangeValueAnimation("out", viewInfo.refCamera.focal / viewInfo.refCamera.yAspect, viewInfo.viewSpot.focal / viewInfo.refCamera.yAspect, animStart, animStart + duration), gVis.renderContext.cameraNode);
    cameraAnim.Add(zoomAnim);

    var poseAnim = new CapturingReality.Vis.Animation.SetCameraLookAtAnimation(
        new CapturingReality.Vis.Animation.EaseMovePointAnimation("inout", viewInfo.refCamera.C, viewInfo.viewSpot.C, animStart, animStart + duration * 0.7),
        new CapturingReality.Vis.Animation.EaseMovePointAnimation("inout", LA.Add(viewInfo.refCamera.C, viewInfo.refCamera.r3), viewInfo.viewSpot.D, animStart, animStart + duration * 0.7),
        LA.VectorMulScalar(-1, viewInfo.viewSpot.r2), gVis.renderContext.cameraNode);
    cameraAnim.Add(poseAnim);

    // remove previous and add new
    gVis.animation.RemoveByName("cameraAnimation");
    gVis.animation.Add(cameraAnim);
}

function SetInfoPanelText(text, severity) {
    if (typeof text !== 'string') {
        console.debug(text);
    }
    if (severity == 1) {    // error
        text = "<span style='color:red'>" + text + "</span>";
        gLog.Log(text, 128, CapturingReality.Logger.Severity.error);
    }
    document.getElementById('idInfoPanel').innerHTML = text;
}

function OnUpdateProgress( state, progress ) {

    var percentage = Math.ceil(progress.progress * 100) + '%';
    document.getElementById('idProgress').style.width = percentage;

    if (state.lastProgressId != progress.processID) {

        var processFlag = GetProcessFlag(progress.processID);
        var processName = GetProcessName(progress.processID);

        state.lastProgressId = progress.processID;
        state.lastProgresName = processName;
        state.lastProgresFlag = processFlag;
    }

    if (state.lastProgresFlag & 1) {
        SetInfoPanelText(state.lastProgresName + ' ' + percentage, 0);
    }
    else {
        SetInfoPanelText(state.lastProgresName, 0);
    }
}

function OnCommunicationError(e) {
    if (e instanceof AppError) {
        SetInfoPanelText(e.message, 1);
        return;
    } else if (e instanceof $cr.Error) {
        // const codes = Object.freeze({
        //     E_FAIL: -2147467259,
        //     E_ACCESSDENIED: -2147024891,
        //     E_NO_SESSION: -2113863422
        // });
        // const code = e.data?.reason?.code;
        SetInfoPanelText(e.message, 1);
        return;
    } else if (e instanceof Error) {
        SetInfoPanelText(e.message, 1);
        return;
    }
    SetInfoPanelText("Please Check Connection", 1);
}

function OnCameraStreamReady(state, cameraCloud) {

    var newCamsO = null;
    var newCamsN = null;
    var res = CapturingReality.ResultCode.Ok;
    if (typeof cameraCloud !== "undefined" && (cameraCloud != null)) {

        var cameras = CapturingReality.RCNodeHelpers.DecodeAndSplitCameras(state.activeCameraSet);
        var viewInfo = CapturingReality.Vis.SceneGraphHelpers.SelectViewSpotAndScale(cameras.cameras, cameras.newOfs, cameras.cameras.length);

        var cameraScale = viewInfo.scale;
        StartLookAtAnimation(viewInfo);

        // previous cameras
        if (cameras.newOfs > 0) {
            newCamsO = new CapturingReality.Vis.SceneGraph.LineCloudSceneNode();
            newCamsO.name = "SceneMotion";
            var cameraFrustums = CapturingReality.Vis.SceneGraphHelpers.CreateCameraFrustumLineCloud(0.3 * cameraScale, cameras.cameras.slice(0, cameras.newOfs));
            res = newCamsO.Initialize(gVis.renderContext.gl, [1, 1, 1], cameraFrustums);
            if (res != CapturingReality.ResultCode.Ok) {
                return res;
            }
        }

        // new cameras
        newCamsN = new CapturingReality.Vis.SceneGraph.LineCloudSceneNode();
        newCamsN.name = "SceneMotionNew";
        var cameraFrustums = CapturingReality.Vis.SceneGraphHelpers.CreateCameraFrustumLineCloud(1 * cameraScale, cameras.cameras.slice(cameras.newOfs));
        res = newCamsN.Initialize(gVis.renderContext.gl, [0.63, 1, 0.35], cameraFrustums);
        if (res != CapturingReality.ResultCode.Ok) {
            return res;
        }

        state.sceneUnit = viewInfo.scale;

        gVis.scene.RemoveByName("CameraDataNode");
        var intersectable = new CapturingReality.Vis.SceneGraph.InvisibleIntersectableCameraCloudSceneNode("CameraDataNode", 1, cameras.cameras);
        gVis.scene.Add(intersectable);

        cameraCloud = null;
    }
    if (newCamsO != null) {
        gVis.scene.RemoveByName("SceneMotion");
        gVis.scene.Add(newCamsO);
    }
    if (newCamsN != null) {
        gVis.scene.RemoveByName("SceneMotionNew");
        gVis.scene.Add(newCamsN);
    }
}

function OnPcdReady(state, pointCloud) {

    var newPcd = null;
    var res = CapturingReality.ResultCode.Ok;
    if (typeof pointCloud !== "undefined" && (pointCloud != null)) {

        newPcd = new CapturingReality.Vis.SceneGraph.ColoredPointCloudSceneNode();
        res = newPcd.Initialize(gVis.renderContext.gl, pointCloud, state.sceneUnit * 50);
        if (res != CapturingReality.ResultCode.Ok) {
            return res;
        }
        newPcd.name = "SceneStructure";

        // create hit-test structure
        var stride = 6;
        if (!Array.isArray(pointCloud)) {
            // byte stream is fffrgbc hence memory layout is equivalent with ffff
            pointCloud = new Float32Array(pointCloud);
            stride = 4;
        }
        gVis.scene.RemoveByName("PointDataNode");
        var intersectable = new CapturingReality.Vis.SceneGraph.InvisibleIntersectablePointCloudSceneNode("PointDataNode", 2, pointCloud, stride);
        gVis.scene.Add(intersectable);
    }

    // add objects
    if (newPcd != null) {
        gVis.scene.RemoveByName("SceneStructure");
        gVis.scene.Add(newPcd);
    }
}

function Sync3DScene(state, project) {

    if (state.fetchingScene || (state.lockRefresh > 0)) {

        // postpone
        return;
    }

    const key = state.sceneInfo.sfm.id + '-' + state.changeCounter;

    // check scene version
    state.fetchingScene = true;
    project.SendCommand({ name: 'selectMaximalComponent' })
    .then(() => {
        const pcdPromise = CapturingReality.RCNodeHelpers.EvaluateTemplate({
            project,
            key: `${key}-pcd`,
            template: 'pcdbin.tpl',
            targetFile: `pcdbin${key}.xyz`,
            optFile: null,
            dataType: 'bytearray',
        }).then(
            pointCloud => { OnPcdReady(state, pointCloud); }
        );
    
        const sfmPromise = CapturingReality.RCNodeHelpers.EvaluateTemplate({
            project,
            key: `${key}-sfm`,
            template: 'sfm.tpl',
            targetFile: `sfm${key}.js`,
        }).then(response => {
            // data ready
            var scriptNode = document.createElement('script');
            scriptNode.innerText = response.response;
            idDataBox.innerHTML = "";
            idDataBox.appendChild(scriptNode);
            OnCameraStreamReady(state, cameraCloud);
        });

        return Promise.all([ pcdPromise, sfmPromise ]);
    }).catch(
        OnCommunicationError
    ).finally(() => {

        state.fetchingScene = false;
    });
}

function Test3DSceneChanged(state, scene) {
    var prev = state.sceneInfo;
    state.sceneInfo = scene;

    if (prev == null) {
        prev = {
            componentCount: 0, sfm: { id: "null", cameraCount: 0, pointCount: 0 }, projectId: "null"
        };
    }

    if (scene.componentCount == 0) {
        if (prev.componentCount > 0) {
            // new project started
            NewScene(state);
        }
        return false;
    }

    if (prev.projectId != scene.projectId) {

        // new project started/loaded (scene is not empty)
        ResetCameraHistory(state);
        return true;
    }

    if ((prev.sfm == null) || (prev.sfm.id != scene.sfm.id)) {
        // new scene content
        return true;
    }

    if ((prev.sfm.cameraCount != scene.sfm.cameraCount) || (prev.sfm.pointCount != scene.sfm.pointCount)) {
        // component edit
        return true;
    }

    return false;
}

function PauseSynchronization(state) {
    state.lockRefresh++;
}

function ContinueSynchronization( state, project ) {
    state.lockRefresh--;
    if (!state.lockRefresh && (state.syncId == 0)) {
        state.syncId = 1;
        Delay( state.updateFrequency ).then(() => {
            Synchronize( project );
        }).catch(
            OnCommunicationError
        );
    }
}

function Synchronize( project ) {
    const state = gState;

    state.syncId = 0;
    if (state.fetching || (state.lockRefresh > 0)) {

        // postpone
        return;
    }

    // check scene version
    state.fetching = true;

    project.GetStatus()
    .then(res => {
        OnUpdateProgress(state, res);
        state.updateFrequency = (res.processID >= 0) ? 800 : 1600;

        if ((res.processID == -1) && state.pendingAlignment) {
            // schedule alignment
            Align(state, project);
        }

        if (res.changeCounter != state.changeCounter) {
            state.changeCounter = res.changeCounter;

            var key = res.projectID + '-' + state.changeCounter;

            // query scene data
            return CapturingReality.RCNodeHelpers.EvaluateTemplate({
                project,
                key,
                template: 'project.tpl',
                targetFile: `project-${key}.json`,
            }).then(
                (e) => {
                    const scene = JSON.parse(e.response);
                    if (Test3DSceneChanged(state, scene)) {
                        Sync3DScene(state, project);
                    }
                }
            )
        }
    }).catch(
        OnCommunicationError
    ).finally(() => {

        state.fetching = false;
        state.syncId = 1;
        if( state.isActive ){
            Delay( state.updateFrequency ).then(() => {
                Synchronize( project );
            }).catch(
                OnCommunicationError
            );
        }
    });
}

function PrepareReportTemplate(project) {
    // send generator template
    var jobs = [];

    var motion = '$Using("CapturingReality.Report.SfmExportFunctionSet")var cameraCloud = [ $ExportCameras($(originalImageIndex),$(aYaw:.4),$(aPitch:.4),$(aRoll:.4),$(aX:.4),$(aY:.4),$(aZ:.4),$(f:.3),$(height/width:.3),)$Strip(1)];$[# signature:DW+6RbS+rkwUZzCj0cSSWvYUXobQHt6TCOkDL6+9oqPq59k3nINCu+evmSdhylRu7xeo/MlKYoONdt8NZaK6Ogw7ztHiZ+uvIVwHo3D59OO/DQ8OehEn7PYeed58vovvfBEf3cVzttoEgE+MgPeTJquf7fbgtoAdwkTnsj7N+qg= ]';
    var fileBlob = new Blob([motion]);
    jobs.push(project.UploadFile({ name: 'sfm.tpl', folder: "output" }, fileBlob));

    var projInfo = '$ExportProjectInfo("name":"$(projectName)","componentCount":$(componentCount),"imageCount":$(imageCount),"projectId":"$(projectGUID)"';
    var sfmInfo = '"id": "$(actualComponentGUID)","cameraCount": $(cameraCount),"pointCount": $(pointCount),"measurementCount": $(measurementCount), "displayScale":$(displayScale)';
    var report = '$Using("CapturingReality.Report.ProjectInformationExportFunctionSet")$Using("CapturingReality.Report.SfmExportFunctionSet"){' + projInfo + ' $If(componentCount>0,,"sfm":{' + sfmInfo + '})) }$[# signature:OwwxMRNKwHq1dyq2fspqoyKf7K3MdWefzsOCPAPaaDFi6C0lRqC3tRcfF/jOI2bwy4YZCtb3ll6MdO6VN/i7T3wSbMiX3ORcVfphaQBTcdATVVLoJYS9EQPGYVEYMCgoTBl8yHpcJOm42hhWV7kDv9OqIEKFtspg9tDd1PWehWk= ]';
    var fileBlob = new Blob([report]);
    jobs.push(project.UploadFile({ name: 'project.tpl', folder: "output" }, fileBlob));

    var binStructure = '$Using("CapturingReality.Report.SfmExportFunctionSet")$[b]$ExportPointsEx("weak|ill|outlier",0,999999,$(aX:bf)$(aY:bf)$(aZ:bf)$(r:bc)$(g:bc)$(b:bc)$(0:bc))$[# signature:4PwzptJrBLDCC2ksoTkbstPKsjmtOGW1lxA+oIurohMPnZ9/aSslJhDBsd2icyFeLIOUB2MgtFGp3KaoQokgd51qrz+E4F/cnhUslZ/6eT7t2IJiL+q+MokhEA6vt3e++s3kDuGSTklXmVR9EHcCZ15VrIhkElR9sxO/qMSDM68= ]';
    var fileBlob = new Blob([binStructure]);
    jobs.push(project.UploadFile({ name: 'pcdbin.tpl', folder: "output" }, fileBlob));

    return Promise.all(jobs);
}

function GetTimeString() {
    var d = new Date();
    var dd = d.getDate();
    var mm = d.getMonth() + 1;
    var yyyy = d.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    var hr = d.getHours();
    var min = d.getMinutes();
    if (min < 10) {
        min = "0" + min;
    }
    var sec = d.getSeconds();
    if (sec < 10) {
        sec = "0" + sec;
    }
    return yyyy + '-' + mm + '-' + dd + '-' + hr + '' + min + '' + sec;
}

function Align(state, project) {
    project.SendCommand({ name: "align" }).then(() => {
        Synchronize( project );
    }).catch(
        OnCommunicationError
    ).finally(() => {
        state.pendingAlignment = false;
    });
}

function OnUploaded({ state, project, filename, addState }) {

    state.localProgress.pendingAlignment++;
    state.localProgress.counter++;
    state.localProgress.progress = state.localProgress.counter / state.localProgress.total;
    OnUpdateProgress(state, state.localProgress);

    addState.i++;
    if (addState.i == addState.total) {

        ContinueSynchronization(state, project);

        state.localProgress.jobs--;
        if (state.localProgress.jobs == 0) {

            state.localProgress.counter = 0;
            state.localProgress.total = 0;
            state.localProgress.progress = 0;
            state.localProgress.pendingAlignment = 0;
            state.pendingAlignment = true;
        }

        if (state.localProgress.pendingAlignment > 15) {
            state.localProgress.pendingAlignment = 0;
            Align(state, project);
        }
    }
    return Promise.resolve();
}

function OnUploadFailed({ state, project, file, filename, addState, reason, maxRetry = 3 }) {

    if (maxRetry > 0) {
        // wait and retry
        Delay( 500 ).then(() => {
            gLog.Log('Retry file upload "' + filename + '".', 128, CapturingReality.Logger.Severity.warning);
            return project.SendCommand({ name: 'add', param1: filename }, file).then(
                () => OnUploaded({ state, project, filename, addState }),
                error => OnUploadFailed({ state, project, file, filename, addState, reason: error, maxRetry: maxRetry - 1 })
            );
        }).catch(
            OnCommunicationError
        );
        return Promise.resolve();
    }
    else {
        // skip file
        gLog.Log(`Failed to upload file "${filename}": ${reason.message}.`, 128, CapturingReality.Logger.Severity.error);
        OnUploaded({ state, project, filename, addState });
    }
    return Promise.reject(reason);
}

// Exports
$cr.SecondScreen = new (function CreateSecondScreen() {
    this.project = null;

    this.BindProject = function( project ) {
        this.project = project;
    }

    this.UploadAndRegister = function(src, { bRename = false }) {
        if (src == null) {
            return;
        }
        const files = src.files;
        const addState = {
            i: 0,
            total: files.length,
        };
        const state = gState;
        if (files.length > 0) {

            PauseSynchronization(state);

            state.localProgress.processID = -2;
            state.localProgress.jobs++;
            state.localProgress.total += files.length;
            state.localProgress.progress = state.localProgress.counter / state.localProgress.total;
            OnUpdateProgress(state, state.localProgress);

            const project = this.project;
            for (let i = 0; i < files.length; ++i) {
                let file = files.item(i);
                let filename = file.name;
                if (bRename) {
                    filename = GetTimeString() + '-' + (state.photoIndex++) + '-' + filename;
                }
                let promise = null;
                if (file.name.match(/.(jpg|jpeg|png|gif)$/i)) {
                    promise = project.SendCommand({ name: 'add', param1: filename }, file);
                } else {
                    promise = project.UploadFile({ name: filename }, file);
                }
                promise.then(
                    () => OnUploaded({ state, project, filename, addState }),
                    error => OnUploadFailed({ state, project, file, filename, reason: error, addState })
                ).catch(
                    OnCommunicationError
                );
            }
        }
    }
    this.OnAddImages = function() {
        var sourceCtl = document.getElementById('idAddImageSource');
        if (sourceCtl) {
            sourceCtl.click();
        }
    }
    this.OnNewSession = function() {
        SetActiveProject({ project: null });
    }
    this.OnNewScene = function() {
        this.project.SendCommand({ name: 'newScene' });
    }
    this.OnSaveSceneAs = function() {
        const state = gState;
        var previousName = state.sceneInfo == null ? 'newScene' : state.sceneInfo.name;
        var newName = prompt("Enter Scene Name", previousName);
        if (newName != null) {
            this.project.Save(newName);
        }
    }
    this.OnSaveScene = function() {
        const state = gState;
        if ((state.sceneInfo == null) || (state.sceneInfo.name == '') || (state.sceneInfo.name == 'New project')) {
            this.OnSaveSceneAs();
        }
        else {
            this.project.Save(state.sceneInfo.name);
        }
    }
    this.OnToggleConsole = function() {
        var logCtl = document.getElementById('idLog');
        if (logCtl) {
            var bIsVisible = logCtl.style.display == 'block';
            logCtl.style.display = bIsVisible ? 'none' : 'block';
        }
    }
}) ();

const EventSubjectSymbol = Symbol("EventSubject");
function AddEventSubject({ elem, event }) {
    if (!(elem instanceof HTMLElement)) {
        throw new AppError({ message: "elem is not HTMLElement" });
    }

    if ( typeof elem[EventSubjectSymbol] !== 'object') {
        elem[EventSubjectSymbol] = {};
    }
    // check if subject already exists
    if ( elem[EventSubjectSymbol][event] ) {
        return elem[EventSubjectSymbol][event];
    } else {
        const listener = (e) => {
            subject.next(e);
        };
        const subject = new $cr.Rx.Subject({ empty: () => {
            elem.removeEventListener(event, listener, false);
            delete elem[EventSubjectSymbol][event];
        }});
        elem.addEventListener(event, listener, false);
        elem[EventSubjectSymbol][event] = subject;
        return subject;
    }
}

function CreateAppLayout( moduleRoot ) {
    var appBody = //html
    `
    <template id="idSessionMenuTemplate">
        <div class="sessionMenu">
            <h1 class="sessionMenuTitle">Choose a project</h1>
            <button class="sessionRefresh flatButton">Refresh</button>
            <button class="sessionNew flatButton flatButtonPrimary">New project</button>
            <h2 class="sessionMenuCategory">Sessions</h2>
            <table class="sessionTable flatTable">
                <thead>
                    <tr><th>Session</th><th>Actions</th></tr>
                </thead>
                <tbody>
                </tbody>
            </table>
            <h2 class="sessionMenuCategory">Projects</h2>
            <table class="projectTable flatTable">
                <thead>
                    <tr><th>Scene Name</th><th>Saved On</th><th>Actions</th></tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>
    </template>
    <template id="idSessionTemplate">
        <tr><td class="sessionName">Name</td><td class="sessionActions">
            <button class="sessionJoin flatButton flatButtonPrimary">Join</button>
            <button class="sessionClose flatButton flatButtonDanger">Close</button>
        </td></tr>
    </template>
    <template id="idSceneTemplate">
        <tr><td class="sceneName">MyScene</td><td class="sceneLast">Date</td><td class="sceneActions">
            <button class="sceneOpen flatButton flatButtonPrimary">Open</button>
            <button class="sceneDelete flatButton flatButtonDanger">Delete</button>
        </td></tr>
    </template>
    <div id="idPage" class="pageLayout">
        <div id="idProgressOuter"><div id="idProgress"></div></div>
        <div class="pageHead">
            <div class="Width40">
                <div id="idInfoPanel">Initializing ...</div>
            </div>
            <div class="Width60 appTitle" style="float:right">
                <div><h1>RealityCapture <span class="blue">Second Screen</span></h1></div>
            </div>
        </div>
        <div id="idModalBackground">
            <div id="idModalWindow">
            </div>
        </div>
        <canvas class="pageClient" id="idSceneView" oncontextmenu="return false;"></canvas>
        <div id="idRightDock">
            <ul id="idRightToolbar" class="verticalToolbar">
                <li>
                    <a id="idTakePhoto" style="background-image: url('${moduleRoot}/icones.png');" class="toolbutton"></a>
                </li>
                <li>
                    <div id="idCommandMenu" class="dropDown">
                        <div class="dropDownContentCancel"></div>
                        <div class="dropDownContent">
                            <a href="#" data-target-id="OnAddImages">Add Images</a>
                            <a href="#" data-target-id="OnNewScene">New Scene</a>
                            <a href="#" data-target-id="OnSaveScene">Save Scene</a>
                            <a href="#" data-target-id="OnSaveSceneAs">Save Scene as</a>
                            <a href="#" data-target-id="OnNewSession">New Session</a>
                            <a href="#" data-target-id="OnToggleConsole">Toggle Console</a>
                        </div>
                    </div>
                    <a href="#" id="idDropDownBtn" style="background-image: url('${moduleRoot}/icones.png');" class="toolbutton"></a>
                </li>
            </ul>
        </div>
        <form method="post" id="idUploadProxy" enctype="multipart/form-data" style="display:none">
            <input type="file" id="idAddImageSource" name="upload[]" multiple accept="image/*">
            <input type="file" id="idTakeImageSource" name="upload[]" multiple accept="image/*" capture="camera">
        </form>
        <div id="idDataBox"></div>
        <div id="idLog"></div>
    </div>
    `;

    document.body.innerHTML = appBody;

    const takeImage = document.getElementById('idTakeImageSource');
    // Toolbar
    AddEventSubject({
        elem: document.getElementById('idTakePhoto'),
        event: 'click'
    }).subscribe(e => {
        takeImage.click();
    });

    // Bind menu
    const menuElem = document.getElementById('idCommandMenu');
    AddEventSubject({ elem: menuElem, event: 'click'}).subscribe((e) => {
        if (e.target.tagName === "A" && e.target.dataset?.targetId) {
            $cr.SecondScreen[e.target.dataset.targetId]();
        }
        menuElem.style.display = "none";
    });
    const menuButton = document.getElementById('idDropDownBtn');
    AddEventSubject({ elem: menuButton, event: 'click'}).subscribe((e) => {
        menuElem.style.display = "block";
    });

    // Bind upload form
    AddEventSubject({
        elem: document.getElementById('idAddImageSource'),
        event: 'change'
    }).subscribe(e => {
        $cr.SecondScreen.UploadAndRegister(e.target, { bRename: false });
    });
    AddEventSubject({
        elem: takeImage,
        event: 'change'
    }).subscribe(e => {
        $cr.SecondScreen.UploadAndRegister(e.target, { bRename: true });
    })

    // Bind modal window
    gModalWindow = new ModalWindow({
        bgTag: document.getElementById('idModalBackground'),
        winTag: document.getElementById('idModalWindow')
    });
}

const gSessionMenu = new (function SessionMenu() {
    this.Display = function() {
        const sessionRoot = document.getElementById('idSessionMenuTemplate').content.cloneNode(true);

        // sessions
        AddEventSubject({ elem: sessionRoot.querySelector('.sessionNew'), event: 'click' })
        .subscribe(() => {
            gNode.CreateProject().then((project) => {
                SetActiveProject({ project });
            }).catch(
                OnCommunicationError
            );
        });
        AddEventSubject({ elem: sessionRoot.querySelector('.sessionRefresh'), event: 'click' })
        .subscribe(() => {
            this.Display();
        });
        const sessionTableBody = sessionRoot.querySelector('.sessionTable tbody');
        sessionTableBody.innerHTML = '<tr><td colspan="2">Loading</td></tr>';
        gNode.GetStatus().then(status => {
            const { sessionIds } = status;
            if (Array.isArray(sessionIds) && sessionIds.length !== 0) {
                // clear
                sessionTableBody.textContent = '';

                const sessionTemplate = document.getElementById('idSessionTemplate').content.cloneNode(true);
                sessionIds.forEach(sessionId => {
                    const sessionNode = sessionTemplate.cloneNode(true);
                    sessionNode.querySelector('.sessionName').textContent = sessionId;
                    AddEventSubject({ elem: sessionNode.querySelector('.sessionJoin'), event: 'click' })
                    .subscribe(() => {
                        gNode.JoinSession(sessionId).then(project => {
                            SetActiveProject({ project, sessionOwner: false });
                        })
                    });
                    AddEventSubject({ elem: sessionNode.querySelector('.sessionClose'), event: 'click' })
                    .subscribe(() => {
                        gNode.CloseSession(sessionId).then(() => {
                            this.Display();
                        })
                    });
                    sessionTableBody.appendChild(sessionNode);
                });
            } else {
                sessionTableBody.innerHTML = '<tr><td colspan="2">No active sessions</td></tr>';
            }
        });

        // projects
        const projectTableBody = sessionRoot.querySelector('.projectTable tbody');
        projectTableBody.innerHTML = '<tr><td colspan="3">Loading</td></tr>'
        gNode.GetProjects().then(projects => {
            const sceneTemplate = document.getElementById('idSceneTemplate').content.cloneNode(true);
            if (Array.isArray(projects) && projects.length !== 0) {
                // clear
                projectTableBody.textContent = '';

                projects.sort((l, r) => {
                    return r.timeStamp - l.timeStamp;
                })

                projects.forEach(proj => {
                    const projScene = sceneTemplate.cloneNode(true);
                    projScene.querySelector('.sceneName').innerText = proj.name;
                    projScene.querySelector('.sceneLast').innerText = new Date(proj.timeStamp * 1000).toLocaleString();
                    const projectOpenBtn = projScene.querySelector('.sceneOpen');
                    AddEventSubject({ elem: projectOpenBtn, event: 'click' }).subscribe(() => {
                        const projectId = proj.guid;
                        gNode.OpenProject(projectId).then(project => {
                            SetActiveProject({ project });
                        }).catch(
                            OnCommunicationError
                        );
                    });
                    const projectDeleteBtn = projScene.querySelector('.sceneDelete');
                    AddEventSubject({ elem: projectDeleteBtn, event: 'click' }).subscribe(() => {
                        const projectId = proj.guid;
                        if (confirm(`Do you want to delete ${proj.name}?`)) {
                            gNode.DeleteProject(projectId).then(() => {
                                this.Display();
                            });
                        }
                    });
                    projectTableBody.appendChild(projScene);
                })
            } else {
                projectTableBody.innerHTML = '<tr><td colspan="3">No saved projects</td></tr>';
            }
        });
        gModalWindow.Clear();
        gModalWindow.ShowHtml({ tag: sessionRoot });
    }

    this.Hide = function() {
        gModalWindow.Hide();
    }
}) ();

function Create( moduleRoot ) {
    CreateAppLayout( moduleRoot );

    gLog = new CapturingReality.Logger.SimpleLog(idLog);
    gLog.Log("Log initialized");

    let res = InitializeRenderer();
    if (res != CapturingReality.ResultCode.Ok) {
        SetInfoPanelText("Rendering Failed", 1);
        return;
    }

    gProjectChange.subscribe(( project ) => {
        if ( project ) {
            SetInfoPanelText("Initializing ...", 0);
            gSessionMenu.Hide();
            // update the url
            const url = new URL($win.location.href);
            url.searchParams.set('session', project.sessionToken);
            $win.history.replaceState({}, document.title, url.href);

            $cr.SecondScreen.BindProject( project );
            InitializeStates();
            const state = gState;

            let res = NewScene(state);
            if (res == CapturingReality.ResultCode.Ok) {
                PrepareReportTemplate(project).then(() => {
                    Synchronize( project );
                }).catch(
                    OnCommunicationError
                );
                requestAnimationFrame(Render);
            }
        } else {
            gSessionMenu.Display();
            // update the url
            const url = new URL($win.location.href);
            url.searchParams.delete('session');
            $win.history.replaceState({}, document.title, url.href);

            $cr.SecondScreen.BindProject( null );
        }
    });

    InitializeNode()
    .catch(
        OnCommunicationError
    )
}

/*
$win.addEventListener('error', (e) => {
    OnCommunicationError(e);
    return true;
})
$win.addEventListener('unhandledrejection', (e) => {
    console.log('On unhandled rejection listener');
    console.error(e);
    OnCommunicationError(e);
    return true;
})
*/

const ThisModuleName = 'CapturingReality.SecondScreen';
$cr.Bootloader.AddOnModuleLoad( ThisModuleName, function( module ) {
    console.info(`${ThisModuleName}: Loaded.`);
    Create( module.moduleRoot );
    return Promise.resolve();
});

}) ( CapturingReality, window );
