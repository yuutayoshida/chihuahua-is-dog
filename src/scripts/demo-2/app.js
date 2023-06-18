import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Fan } from './fan';
import GUI from 'lil-gui';

window.addEventListener('DOMContentLoaded', () => {
    const app = new App3();
    app.init();
    app.render();
}, false);

class App3 {
    static get CAMERA_PARAM() {
        return {
            fovy: 60,
            aspect: window.innerWidth / window.innerHeight,
            near: 0.1,
            far: 30.0,
            x: 0.0,
            y: 0.0,
            z: 10.0,
            lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
        };
    }

    static get RENDERER_PARAM() {
        return {
            clearColor: 0xafafb0,
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }

    static get DIRECTIONAL_LIGHT_PARAM() {
        return {
            color: 0xffffff,
            intensity: 1.4,
            x: 0.0,
            y: 3.0,
            z: 8.0,
        };
    }

    static get AMBIENT_LIGHT_PARAM() {
        return {
            color: 0xffffff,
            intensity: 0.4,
        };
    }

    static get MATERIAL_PARAM() {
        return {
            color: 0xe1e5ea,
        }
    }

    static get FOG_PARAM() {
        return {
        fogColor: 0xafafb0,
        fogNear: 1.0,
        fogFar: 25.0
        };
    }

    constructor() {
        this.renderer;
        this.scene;
        this.camera;
        this.directionalLight;
        this.ambientLight;
        this.controls;
        this.axesHelper;
        this.material;
        this.fan_1;
        this.fan_2;
        this.fan_3;
        this.group;
        this.fanGroup;
        this.navGroup;
        this.swingFlag = false;
        this.gui;
        this.isActiveSwing = false;
        this.isActiveRotateFans = false;
        this.isActiveRotateEachWings = true;

        // renderメソッド内のrequestAnimationFrameでthisがグローバルレベルになるのを阻止
        this.render = this.render.bind(this);

        // リサイズ時にアスペクト比を変更
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }, false);
    }

    /**
     * 初期化
     */
    init() {
        // レンダラー
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(new THREE.Color(App3.RENDERER_PARAM.clearColor));
        this.renderer.setSize(App3.RENDERER_PARAM.width, App3.RENDERER_PARAM.height);
        const wrapper = document.getElementById('webgl');
        wrapper.appendChild(this.renderer.domElement);

        // シーン
        this.scene = new THREE.Scene();
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // フォグ
        this.scene.fog = new THREE.Fog(
            App3.FOG_PARAM.fogColor,
            App3.FOG_PARAM.fogNear,
            App3.FOG_PARAM.fogFar
          );

        // カメラ
        this.camera = new THREE.PerspectiveCamera(
            App3.CAMERA_PARAM.fovy,
            App3.CAMERA_PARAM.aspect,
            App3.CAMERA_PARAM.near,
            App3.CAMERA_PARAM.far,
        );
        this.camera.position.set(
            App3.CAMERA_PARAM.x,
            App3.CAMERA_PARAM.y,
            App3.CAMERA_PARAM.z,
        );
        this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

        // 平行光源
        this.directionalLight = new THREE.DirectionalLight(
            App3.DIRECTIONAL_LIGHT_PARAM.color,
            App3.DIRECTIONAL_LIGHT_PARAM.intensity,
        );
        this.directionalLight.position.set(
            App3.DIRECTIONAL_LIGHT_PARAM.x,
            App3.DIRECTIONAL_LIGHT_PARAM.y,
            App3.DIRECTIONAL_LIGHT_PARAM.z,
        );
        this.scene.add(this.directionalLight);

        // 環境光源
        this.ambientLight = new THREE.AmbientLight(
            App3.AMBIENT_LIGHT_PARAM.color,
            App3.AMBIENT_LIGHT_PARAM.intensity,
        );
        this.scene.add(this.ambientLight);

        // マテリアル（共通）
        this.material = new THREE.MeshToonMaterial(App3.MATERIAL_PARAM);

        //扇風機生成
        this.fanGroup = new THREE.Group();
        this.group.add(this.fanGroup);
        const radian = (120 * Math.PI) / 180;
        this.fan_1 = new Fan(this.material, 1.0, 5);
        this.fan_1.position.set(
            1.4 * Math.cos(0),
            1.4 * Math.sin(0),
            0.0
        );
        this.fanGroup.add(this.fan_1);

        this.fan_2 = new Fan(this.material, 1.0, 5);
        this.fan_2.position.set(
            1.4 * Math.cos(radian),
            1.4 * Math.sin(radian),
            0.0
        );
        this.fanGroup.add(this.fan_2);

        this.fan_3 = new Fan(this.material, 1.0, 5);
        this.fan_3.position.set(
            1.4 * Math.cos(radian * 2),
            1.4 * Math.sin(radian * 2),
            0.0
        );
        this.fanGroup.add(this.fan_3);


        //親フレーム
        const backParts = new THREE.Mesh(
            new THREE.CylinderGeometry(
                3.0,
                3.0 * 0.6,
                3.0 * 0.4,
            ),
            this.material
        );
        backParts.rotation.x = (90.0 * Math.PI) / 180;
        backParts.position.set(0.0,0.0,-0.65);
        this.group.add(backParts);

        const frame = new THREE.Mesh(
            new THREE.TorusGeometry(3.0, 0.3),
            this.material
        );
        frame.position.set(0.0,0.0,0.0);
        this.group.add(frame);

        //ナビ
        this.navGroup = new THREE.Group();
        this.navGroup.rotation.x = (90.0 * Math.PI) / 180;
        this.navGroup.position.set(
            0.0,
            -4.5,
            -0.5
        )
        this.scene.add(this.navGroup);

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.6, 0.25),
            this.material
        );
        ring.position.set(0.0,0.0,0.0);
        this.navGroup.add(ring);

        const angleStep = (120 * Math.PI) / 180;
        for(let i = 0; i < 3; i++){
            const cone = new THREE.Mesh(
                new THREE.SphereGeometry(0.5),
                this.material
            );  
            const angle = angleStep * i;
            cone.position.set(
                1.65 * Math.cos(angle),
                1.65 * Math.sin(angle),
                0.0,
            );    
            
            this.navGroup.add(cone);
        }

         // コントロール
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // GUI
        this.gui = new GUI();
        const obj = {
            swing: false,
            rotateFans: false,
            rotateEachFans: true,
            wingNumber: 5,
        }
        
        this.gui.add( obj, 'swing' ).onChange(value => this.isActiveSwing = value);
        this.gui.add( obj, 'rotateFans' ).onChange(value => this.isActiveRotateFans = value);
        this.gui.add( obj, 'rotateEachFans' ).onChange(value => this.isActiveRotateEachWings = value );
        this.gui.add( obj, 'wingNumber', 2, 10, 1).onChange(
            value => {
                this.fan_1.createWing(value);
                this.fan_2.createWing(value);
                this.fan_3.createWing(value);
            }
        );

        // ヘルパー
		//const axesBarLength = 5.0;
		//this.axesHelper = new THREE.AxesHelper(axesBarLength);
		//this.scene.add(this.axesHelper);
    }

    /**
     * 描画
     */
    render() {
        // レンダリングをループ
        requestAnimationFrame(this.render);

         // コントロールを更新
        this.controls.update();

        // 首振り
        if(this.group.rotation.y > ((60.0 * Math.PI) / 180)){
            this.swingFlag = false;
        }else if(this.group.rotation.y < ((-60.0 * Math.PI) / 180)){
            this.swingFlag = true;
        }
        if(this.isActiveSwing){
            if(this.swingFlag){
                this.group.rotation.y += 0.01;
                this.navGroup.rotation.z += 0.01;
            }else {
                this.group.rotation.y -= 0.01;
                this.navGroup.rotation.z -= 0.01;
            }
        }

        // 扇風機グループ回転
        if(this.isActiveRotateFans){
            this.fanGroup.rotation.z += 0.01;
        }

        // 各扇風機回転
        if(this.isActiveRotateEachWings){
            this.fan_1.rotateWing();
            this.fan_2.rotateWing();
            this.fan_3.rotateWing();
        }

        // 描画
        this.renderer.render(this.scene, this.camera);
    }
}