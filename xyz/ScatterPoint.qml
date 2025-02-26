import Qt3D.Core 2.12
import Qt3D.Render 2.12
import Qt3D.Extras 2.12

Entity {
    property vector3d translation: Qt.vector3d(0, 0, 0)
    property color color: "blue"

    components: [
        Transform { translation: parent.translation },
        SphereMesh { radius: 3 }, // 调整半径以可见
        PhongMaterial {
            ambient: parent.color
            diffuse: parent.color
        }
    ]
}
