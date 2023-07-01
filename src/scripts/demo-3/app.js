import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


window.addEventListener('DOMContentLoaded', () => {
    const app = new App3();
    app.load()
    .then(() => {
        app.init();
        app.render();
    })
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
        }
    }

    static get RENDERER_PARAM() {
        return {
            clearColor: 0x0f0f0f,
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
        }
    }

    static get AMBIENT_LIGHT_PARAM() {
        return {
            color: 0xffffff,
            intensity: 0.4,
        }
    }

    /*＊
    * 地球のサイズ
    */
    static get EARTH_SCALE() { return 1.0; }

    /*＊
    * 飛行機のサイズ
    */
    static get AIRPLANE_SCALE() { return 1.0; }

    /*＊
    * 地球からの距離
    */
    static get AIRPLANE_DISTANCE() { return 2.3; }

    /*＊
    * 飛行機の移動用パラメータ
    */
    static get AIRPLANE_MOVE_PARAM() {
        return {
            speed: 0.02, //移動速度
            turn: 0.1, //曲がる力
        }
    }

    /*＊
    * 目的地マテリアル
    */
    static get GOAL_MATERIAL_PARAM() {
        return {
            color: 0xffffff,
        }
    }

    /*＊
    * 目的地到達とする距離
    */
    static get GOAL_DISTANCE() { return 0.03; }

    constructor() {
        this.renderer;
        this.scene;
        this.camera;
        this.directionalLight;
        this.ambientLight;
        this.controls;
        this.axesHelper;
        this.earth;
        this.airplane;
        this.goal;
        this.airplaneDirection;

        // renderメソッド内のrequestAnimationFrameでthisがグローバルレベルになるのを阻止
        this.render = this.render.bind(this);

        // リサイズ時にアスペクト比を変更
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }, false);
    }

    load() {
        return new Promise((resolve) => {
            const gltfLoader = new GLTFLoader();
            const gltfEarthPath = '/src/scripts/demo-3/models/earth.glb';
            const gltfAirplanePath = '/src/scripts/demo-3/models/airplane.glb';
            gltfLoader.load(gltfEarthPath, (gltfEarth) => {
                this.earth = gltfEarth.scene;
                gltfLoader.load(gltfAirplanePath, (gltfAirplane) => {
                    this.airplane = gltfAirplane.scene;
                    resolve();
                  });
            });
        });
    }

    init() {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(new THREE.Color(App3.RENDERER_PARAM.clearColor));
        this.renderer.setSize(App3.RENDERER_PARAM.width, App3.RENDERER_PARAM.height);
        const wrapper = document.getElementById('webgl');
        wrapper.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();

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

        // ディレクショナルライト（平行光源）
        this.directionalLight = new THREE.DirectionalLight(
            App3.DIRECTIONAL_LIGHT_PARAM.color,
            App3.DIRECTIONAL_LIGHT_PARAM.intensity
        );
        this.directionalLight.position.set(
            App3.DIRECTIONAL_LIGHT_PARAM.x,
            App3.DIRECTIONAL_LIGHT_PARAM.y,
            App3.DIRECTIONAL_LIGHT_PARAM.z,
        );
        this.scene.add(this.directionalLight);

        // アンビエントライト（環境光）
        this.ambientLight = new THREE.AmbientLight(
            App3.AMBIENT_LIGHT_PARAM.color,
            App3.AMBIENT_LIGHT_PARAM.intensity,
        );
        this.scene.add(this.ambientLight);


        // 地球
        this.earth.scale.set(2.0, 2.0, 2.0);
        this.scene.add(this.earth);
    
        // 飛行機
        this.airplane.scale.set(0.6, 0.6, 0.6);
        this.airplane.position.set(0.0, 2.3, 0.0);
        this.scene.add(this.airplane);
        // 進行方向ベクトルの初期値を設定
        this.airplaneDirection = new THREE.Vector3(0.0, 0.0, 1.0).normalize();

        // ゴールポイント
        this.goal = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshPhongMaterial({color: 0xDF013A,}),
        );
        // 最初のゴールポイント
        const position = this.getRandomCoordinates();
        this.goal.position.copy(position);
        this.scene.add(this.goal);

        // コントロール
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  
        // ヘルパー
        const axesBarLength = 5.0;
        this.axesHelper = new THREE.AxesHelper(axesBarLength);
        this.scene.add(this.axesHelper);
    }
    render() {
        // レンダリングをループ
        requestAnimationFrame(this.render);

        // コントロールを更新
        this.controls.update();

        // 飛行機とゴールを結ぶベクトルを取得
        let subVector = new THREE.Vector3().subVectors(this.goal.position, this.airplane.position);
        // ベクトルの長さが一定以下の場合は新しい目標値を設定する
        if(subVector.length() <= App3.GOAL_DISTANCE) {
            let newGoalPosition = this.getRandomCoordinates();
            let twoGoalsVector = new THREE.Vector3().subVectors(newGoalPosition, this.goal.position);
            while(twoGoalsVector.length() < App3.GOAL_DISTANCE) {
                console.log('test');
                newGoalPosition = this.getRandomCoordinates();
                twoGoalsVector = new THREE.Vector3().subVectors(newGoalPosition, this.goal.position);
            }
            this.goal.position.copy(newGoalPosition);
            subVector = new THREE.Vector3().subVectors(this.goal.position, this.airplane.position);
        }

        // 向きを取得するだけなので単位化
        subVector.normalize();
        // 飛行機の進行方向ベクトルに単位化した向きベクトルを加算する
        // 少しずつ方向を変化させたいので、曲がる力を加算して小さくする
        this.airplaneDirection.add(subVector.multiplyScalar(App3.AIRPLANE_MOVE_PARAM.turn));
        // 再度単位化する
        this.airplaneDirection.normalize();
        
        // 単位化した進行方向ベクトル
        const direction = this.airplaneDirection.clone();
        // 単位化した進行方向ベクトルに移動したい距離を加算
        const translation = direction.multiplyScalar(App3.AIRPLANE_MOVE_PARAM.speed);
        // ベクトルの足し算で新しいベクトルを作る
        const position =  this.airplane.position.clone().add(translation);
        // 新しいベクトルの長さを調整
        position.setLength(App3.AIRPLANE_DISTANCE);
        // 飛行機の位置として代入
        this.airplane.position.copy(position);

        

        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * ランダムな緯度と経度をもとに原点から一定の距離を持つ座標を求める
     * 緯度 -90 ~ 90 → radian: -PI/2 ~ PI/2
     * 緯度 -180 ~ 180 → radian: -PI ~ PI
     * @returns 
     */
    getRandomCoordinates() {
        // 仰角
        const phi = (Math.random() * Math.PI) - Math.PI / 2;
        // 方位角
        const theta = (Math.random() * (Math.PI * 2)) - Math.PI;
    
        const x = App3.AIRPLANE_DISTANCE * Math.cos(phi) * Math.cos(theta);
        const y = App3.AIRPLANE_DISTANCE * Math.cos(phi) * Math.sin(theta);
        const z = App3.AIRPLANE_DISTANCE * Math.sin(phi);
    
        return new THREE.Vector3(x, y, z);
    }
}