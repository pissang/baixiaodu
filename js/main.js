define(function (require) {

    var Renderer = require('qtek/Renderer');
    var Scene = require('qtek/Scene');
    var PerspectiveCamera = require('qtek/camera/Perspective');
    var GLTFLoader = require('qtek/loader/GLTF');
    var Node = require('qtek/Node');
    var Animation = require('qtek/animation/Animation');
    var DirectionalLight = require('qtek/light/Directional');
    var AmbientLight = require('qtek/light/Ambient');
    var OrbitControl = require('qtek/plugin/OrbitControl');
    var TextureCube = require('qtek/TextureCube');
    var Texture = require('qtek/Texture');
    var textureUtil = require('qtek/util/texture');
    var Vector3 = require('qtek/math/Vector3');

    var renderer = new Renderer({
        canvas: document.getElementById('main')
    });
    renderer.resize(window.innerWidth, window.innerHeight);

    var scene = new Scene();

    var camera = new PerspectiveCamera({
        aspect: renderer.getViewportAspect()
    });
    camera.position.set(0, 10, 15);
    camera.lookAt(new Vector3(0, 5, 0));

    var root = new Node();
    scene.add(root);

    var envTexture = new TextureCube({
        width: 256,
        height: 256
        // type: Texture.FLOAT
    });
    textureUtil.loadPanorama('asset/env.hdr', envTexture, renderer, {
        exposure: 2.0
    });

    // Light
    scene.add(new AmbientLight({
        intensity: 0.8
    }));
    var light = new DirectionalLight({
        intensity: 0.3
    });
    light.position.set(1, 1, 1);
    light.lookAt(scene.position);
    scene.add(light);

    var loader = new GLTFLoader({
        rootNode: root,
        includeCamera: false,
        includeLight: false
    });
    loader.load('asset/baixiaodu-anim.json');
    loader.success(function (res) {
        console.log(res.clip);

        var animation = new Animation();
        var control = new OrbitControl({
            target: camera,
            domElement: renderer.canvas
        });
        animation.start();

        for (var name in res.materials) {
            var material = res.materials[name];
            material.shader.enableTexture('environmentMap');
            material.set('environmentMap', envTexture);
            material.set('glossiness', 0.7);
            material.set('specularColor', [0.15, 0.15, 0.15]);
        }

        res.clip.playbackRate = 1.5;
        animation.addClip(res.clip);

        animation.on('frame', function (deltaTime) {
            control.update(true);

            res.clip.jointClips.forEach(function (jointClip) {
                var node = scene.getNode(jointClip.name);
                node.position.setArray(jointClip.position);
                node.rotation.setArray(jointClip.rotation);
                node.scale.setArray(jointClip.scale);
            });

            renderer.render(scene, camera);
        });
    });
});