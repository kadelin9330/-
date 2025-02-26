import QtQuick 2.13
import Qt3D.Core 2.12
import Qt3D.Render 2.12
import Qt3D.Input 2.13
import Qt3D.Extras 2.12
import QtQuick.Scene3D 2.12
import QtQuick.Controls 2.12
import MyModules 1.0
import QtQuick.Controls 2.12
import "./"

ResizableRectangle {
    id: root
    property string path: "xyz"
    height_width_ratio: 1
    property Item ref: Loader {
        active: false
        sourceComponent: Component {
            Item {
                property var ref_center_point          :   center_point
                property var ref_obj_length            :   obj_length
                property var ref_obj_world_length      :   obj_world_length
                property var ref_root_transform        :   root_transform
                property var ref_scalar_menu           :   scalar_menu
                property var ref_x_menu                :   x_menu
                property var ref_y_menu                :   y_menu
                property var ref_z_menu                :   z_menu
                property var ref_theme                 :   theme
                property var ref_file_menu             :   file_menu
            }
        }
    }

    tips_text: main_mouse.containsMouse ?
                   qsTr("左键拖拽: 旋转视图\n右键: 弹出菜单\n滚轮: 缩放视图") : ""
    tips_visible: main_mouse.containsMouse

    border.width: ((theme.hideBorder && !hovered && !main_mouse.containsMouse) ? 0 : g_settings.applyHScale(1))
    color: "transparent"

    width: g_settings.applyHScale(226)
    height: g_settings.applyHScale(226)
    property bool not_support_change_window_: true
    property int default_width: width
    property int default_height: height
    property real scale: 1
    property color light_color: "#333333"
    property color ambient_color: "#CCCCCC"
    property real arrow_size: 1.5
    property var parent_container
    property var scatterPoints: []

    property string debugMessage: "Waiting for updates..."

    Component.onDestruction: {
        root.enabled = false
    }

    // 初始化记录最大最小值的对象
    property var minMaxValues: ({
        minX: Number.MAX_VALUE,
        maxX: -Number.MAX_VALUE, // 使用负数最大值初始化
        minY: Number.MAX_VALUE,
        maxY: -Number.MAX_VALUE,
        minZ: Number.MAX_VALUE,
        maxZ: -Number.MAX_VALUE
    })




    //右键菜单
    MyIconMenu {
        id: main_menu
        visible: false

        DeleteMenuItem {
            onTriggered: root.destroy()
        }

        ScreenshotMenuItem {
            target: root
        }

        FillParentMenu {
            target: root
        }

        MyMenuSeparator {}

        ChMenu {
            id: x_menu
            checked: bind_obj
            color: "#ff0000"
            title: "X" + (bind_obj ? (" → " + bind_obj.name) : "")
        }

        ChMenu {
            id: y_menu
            checked: bind_obj
            color: "#00ff00"
            title: "Y" + (bind_obj ? (" → " + bind_obj.name) : "")
        }

        ChMenu {
            id: z_menu
            checked: bind_obj
            color: "#0000ff"
            title: "Z" + (bind_obj ? (" → " + bind_obj.name) : "")
        }

        MyMenuSeparator {}
        MenuItem {
            text: "轴长"
            onTriggered: {
                axisLengthDialog.open()
            }
        }

        MenuItem {
            text: "调试信息"
            onTriggered: {
                debugItemDialog.open()
            }
        }

        MenuItem {
            text: "设置摄像机坐标"
            onTriggered: {
                cameraPositionDialog.open()
            }
        }
    }

    // 调用时更新调试信息
    function updateDebugMessage(message) {
        debugMessage = message;
    }

    // 调试信息弹窗
    Dialog {
        id: debugItemDialog
        title: "调试信息"
        Column {
            spacing: 10
            width: 300  // 增加宽度以容纳多行文本
            Label {
                text: debugMessage
                wrapMode: Text.Wrap  // 允许换行
            }
        }
    }

    // 轴长调整的弹出框
    Dialog {
        id: axisLengthDialog
        title: "Adjust Axis Length"

        Column {
            spacing: 10
            width: 200
            height: 100

            // 输入框来调整统一的轴长
            Row {
                Label {
                    text: "Axis Length:"
                }
                TextField {
                    id: axisLengthInput
                    text: "300" // 默认长度
                    inputMethodHints: Qt.ImhFormattedNumbersOnly
                    onEditingFinished: {
                        var newLength = parseFloat(axisLengthInput.text)
                        updateAxisLength(newLength)
                    }
                }
            }

            // 确认按钮
            Button {
                text: "Confirm"
                onClicked: axisLengthDialog.close()
            }
        }
    }

    // 更新所有轴的长度
    function updateAxisLength(newLength) {
            xAxisMesh.length = newLength
            yAxisMesh.length = newLength
            zAxisMesh.length = newLength
    }

    // 摄像机坐标设置的弹出框
    Dialog {
        id: cameraPositionDialog
        title: "Set Camera Position"

        Column {
            spacing: 10
            width: 250
            height: 150

            // 输入框来调整摄像机坐标
            Row {
                Label {
                    text: "X Coordinate:"
                }
                TextField {
                    id: cameraXInput
                    text: mainCamera.position.x.toFixed(2)  // 默认值为当前摄像机的X坐标
                    inputMethodHints: Qt.ImhFormattedNumbersOnly
                }
            }

            Row {
                Label {
                    text: "Y Coordinate:"
                }
                TextField {
                    id: cameraYInput
                    text: mainCamera.position.y.toFixed(2)  // 默认值为当前摄像机的Y坐标
                    inputMethodHints: Qt.ImhFormattedNumbersOnly
                }
            }

            Row {
                Label {
                    text: "Z Coordinate:"
                }
                TextField {
                    id: cameraZInput
                    text: mainCamera.position.z.toFixed(2)  // 默认值为当前摄像机的Z坐标
                    inputMethodHints: Qt.ImhFormattedNumbersOnly
                }
            }

            // 确认按钮
            Button {
                text: "Confirm"
                onClicked: {
                    // 获取输入框的值并更新摄像机坐标
                    var newX = parseFloat(cameraXInput.text);
                    var newY = parseFloat(cameraYInput.text);
                    var newZ = parseFloat(cameraZInput.text);

                    // 更新摄像机的位置
                    mainCamera.position = Qt.vector3d(newX, newY, newZ);
                    cameraPositionDialog.close();  // 关闭对话框
                }
            }
        }
    }

    Scene3D {
        id: scene3d
        anchors.fill: parent
        cameraAspectRatioMode: Scene3D.AutomaticAspectRatio
        focus: true

        Entity {
            components: [
                RenderSettings {
                    activeFrameGraph: ForwardRenderer {
                        clearColor: "transparent"
                        camera: mainCamera
                    }
                },
                InputSettings { id: inputSettings }
            ]

            Camera {
                id: mainCamera
                projectionType: CameraLens.PerspectiveProjection
                position: Qt.vector3d(600, 600, 600)   // 初始摄像机位置
                viewCenter: Qt.vector3d(0, 0, 0)       // 视角中心
                fieldOfView: 45                        // 视场角
                nearPlane: 0.1
                farPlane: 10000.0
            }

            Entity {
                id: sceneRoot
                components: Transform {
                    id: sceneTransform
                    matrix: Qt.matrix4x4()  // Initialize the matrix
                }

                Entity {
                    components: [rootRotation]

                    Transform {
                        id: rootRotation
                        rotation: Qt.quaternion(1, 0, 0, 0)
                    }

                    // 坐标系中心点
                    Entity {
                        components: [
                            SphereMesh { radius: 5 },
                            PhongMaterial { ambient: "white"; diffuse: "white" }
                        ]
                    }

                    // X轴体系
                    Entity {
                        id: xAxisMesh
                        //text: "X"
                        components: [
                            CylinderMesh { length: 300; radius: 2 },
                            PhongMaterial { ambient: "red"; diffuse: "red" },
                            Transform {
                                rotation: fromAxisAndAngle(Qt.vector3d(0, 0, 1), -90)
                                translation: Qt.vector3d(150, 0, 0)
                            }
                        ]
                    }


                    // Y轴体系
                    Entity {
                        id: yAxisMesh
                        //text: "Y"
                        components: [
                            CylinderMesh { length: 300; radius: 2 },
                            PhongMaterial { ambient: "green"; diffuse: "green" },
                            Transform { translation: Qt.vector3d(0, 150, 0) }
                        ]
                    }


                    // Z轴体系
                    Entity {
                        id: zAxisMesh
                        //text: "Z"
                        components: [
                            CylinderMesh { length: 300; radius: 2 },
                            PhongMaterial { ambient: "blue"; diffuse: "blue" },
                            Transform {
                                rotation: fromAxisAndAngle(Qt.vector3d(1, 0, 0), 90)
                                translation: Qt.vector3d(0, 0, 150)
                            }
                        ]
                    }
                }
            }
        }
    }

    MyMouseArea {
        id: main_mouse
        acceptedButtons: Qt.LeftButton | Qt.RightButton | Qt.MidButton
        anchors.fill: scene3d
        hoverEnabled: true

        property real rotationSpeed: 0.3  // 旋转速度，较小的值会使旋转更平滑
        property real zoomSpeed: 3        // 缩放速度
        property real zoomFactor: 600     // 初始缩放距离
        property vector3d lastPos: Qt.vector3d(0, 0, 0)  // 上次鼠标位置
        property real sphericalX: 0      // 俯仰角度（X轴旋转）
        property real sphericalY: 0      // 偏航角度（Y轴旋转）
        property real cameraDistance: 600  // 相机到中心点的初始距离

        onPressed: {
            if (mouse.button === Qt.LeftButton) {
                lastPos = Qt.vector3d(mouse.x, mouse.y, 0)  // 当前鼠标位置
            }
        }

        onPositionChanged: {
            if (pressedButtons & Qt.LeftButton) {
                // 计算鼠标移动的增量
                let deltaX = mouse.x - lastPos.x
                let deltaY = mouse.y - lastPos.y

                // 使用增量更新旋转角度，避免每次都设置绝对角度
                sphericalX += deltaY * rotationSpeed
                sphericalY += deltaX * rotationSpeed

                // 限制X轴旋转角度为-90到90度，避免翻转
                sphericalX = Math.min(Math.max(sphericalX, -90), 90);
                // Y轴旋转角度保持在0到360度
                sphericalY = sphericalY % 360;

                // 使用球形坐标计算相机的新位置
                let radius = cameraDistance;  // 使用当前的缩放因子作为半径
                let x = radius * Math.sin(sphericalX * Math.PI / 180) * Math.cos(sphericalY * Math.PI / 180);
                let y = radius * Math.sin(sphericalX * Math.PI / 180) * Math.sin(sphericalY * Math.PI / 180);
                let z = radius * Math.cos(sphericalX * Math.PI / 180);

                // 更新相机的位置
                mainCamera.position = Qt.vector3d(x, y, z);
                mainCamera.viewCenter = Qt.vector3d(0, 0, 0);  // 保持视点在中心
                lastPos = Qt.vector3d(mouse.x, mouse.y, 0);  // 更新最后位置
            }
        }


        onWheel: {
            // 控制缩放
            let delta = wheel.angleDelta.y * zoomSpeed
            zoomFactor = Math.max(100, Math.min(zoomFactor + delta, 2000))  // 设置缩放范围

            // let direction = mainCamera.position - Qt.vector3d(0, 0, 0)
            // direction = direction.normalized()  // 将方向向量归一化
            // 根据缩放因子改变相机位置
            let x = zoomFactor*(Math.abs(mainCamera.position.x)/mainCamera.position.x);
            let y = zoomFactor*(Math.abs(mainCamera.position.y)/mainCamera.position.y);
            let z = zoomFactor*(Math.abs(mainCamera.position.z)/mainCamera.position.z);
            mainCamera.position = Qt.vector3d(x, y, z)
        }


        onClicked: {
            if (mouse.button === Qt.RightButton) {
                main_menu.popup()
                //updateDebugMessage("kkkkkk");
            }
        }
    }


    DropArea {
        anchors.fill: parent
        onDropped: {
            var path = sys_manager.data_path;
            if(drop.hasUrls){
                //                reset_mesh();
                for(var i = 0; i < drop.urls.length; i++){
                    var url = drop.urls[i];
                    file_menu.handle_url_from_dialog(
                                url.substring(url.indexOf('///') + 3));
                }
            }
        }
    }



    function get_widget_ctx() {
        var ctx = {
            'path': path,
            'scale': root.scale,
            'theme': theme.get_ctx(),
            'scalar_menu': scalar_menu.get_ctx(),
            'x_menu': x_menu.get_ctx(),
            'y_menu': y_menu.get_ctx(),
            'z_menu': z_menu.get_ctx(),
            'center_point': {
                'x': root.center_point.x,
                'y': root.center_point.y,
                'z': root.center_point.z
            },
            'root_transform': {
                'rotationX': root_transform.rotationX,
                'rotationY': root_transform.rotationY,
                'rotationZ': root_transform.rotationZ
            },
            'obj_length': {
                'x': obj_length.x,
                'y': obj_length.y,
                'z': obj_length.z
            },
            'obj_world_length': {
                'x': root.obj_world_length.x,
                'y': root.obj_world_length.y,
                'z': root.obj_world_length.z
            },
            'file_menu': {
                'selected_file': file_menu.selected_file
            }
        };
        return ctx;
    }


    function set_widget_ctx(ctx) {
        __set_ctx__(root, ctx.ctx, ref);
        //        scene3d.enabled = true;
    }



    function updateScatterData() {
        // 获取当前的 x, y, z 坐标值
        var xValue = x_menu.bind_obj ? x_menu.bind_obj.value : 1;
        var yValue = y_menu.bind_obj ? y_menu.bind_obj.value : 2;
        var zValue = z_menu.bind_obj ? z_menu.bind_obj.value : 3;

        // 将新的坐标加入到散点数组中
        scatterPoints.push({x: xValue, y: yValue, z: zValue});

        // 在场景中绘制新的散点
        createScatterEntity(xValue, yValue, zValue);

        // 确保xValue, yValue, zValue是数字类型
        xValue = parseFloat(xValue);
        yValue = parseFloat(yValue);
        zValue = parseFloat(zValue);
        // 更新记录的最大最小值
        root.minMaxValues.minX = Math.min(root.minMaxValues.minX, xValue);
        root.minMaxValues.maxX = Math.max(root.minMaxValues.maxX, xValue);
        root.minMaxValues.minY = Math.min(root.minMaxValues.minY, yValue);
        root.minMaxValues.maxY = Math.max(root.minMaxValues.maxY, yValue);
        root.minMaxValues.minZ = Math.min(root.minMaxValues.minZ, zValue);
        root.minMaxValues.maxZ = Math.max(root.minMaxValues.maxZ, zValue);
        updateDebugMessage(root.minMaxValues.maxY+","+root.minMaxValues.maxY+","+root.minMaxValues.maxZ+","+root.minMaxValues.minX+","+root.minMaxValues.minY+","+root.minMaxValues.minZ);

    }

    function createScatterEntity(x, y, z) {
        // 使用Qt.createComponent动态创建实体
        var component = Qt.createComponent("ScatterPoint.qml");
        if (component.status === Component.Ready) {
            var entity = component.createObject(sceneRoot, {
                "translation": Qt.vector3d(x, y, z),
                "color": "blue"
            });
            entity.parent = sceneRoot;
            //updateDebugMessage("C: ", x+","+y+","+z);
        } else {
            updateDebugMessage("F: ", x+","+y+","+z);
        }
    }


    Timer {
        id: updateScatterTimer
        interval: 10  // 每秒更新一次（10ms）
        repeat: true
        onTriggered: {
            updateScatterData();  // 每次触发时更新散点
        }
    }

    Component.onCompleted: {
        updateScatterTimer.start();  // 启动定时器
    }

}
