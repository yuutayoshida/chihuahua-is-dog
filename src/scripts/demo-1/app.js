// 必要なモジュールを読み込み
import * as THREE from '../../scripts/lib/three.module.js';
import { OrbitControls } from '../../scripts/lib/OrbitControls.js';
import { gsap } from 'gsap';

// DOM がパースされたことを検出するイベントを設定
window.addEventListener('DOMContentLoaded', () => {
  // 制御クラスのインスタンスを生成
  const app = new App3();
  // 初期化
  const isAvailableStorage = app.checkStorage();
  app.init();
  // 描画
  app.render();
  if(isAvailableStorage){
    app.setStorageEvent();
  }
  app.animate();
}, false);

/**
 * three.js を効率よく扱うために自家製の制御クラスを定義
 */
class App3 {
  /**
   * カメラ定義のための定数
   */
  static get CAMERA_PARAM() {
    return {
      // fovy は Field of View Y のことで、縦方向の視野角を意味する
      fovy: 60,
      // 描画する空間のアスペクト比（縦横比）
      aspect: window.innerWidth / window.innerHeight,
      // 描画する空間のニアクリップ面（最近面）
      near: 0.1,
      // 描画する空間のファークリップ面（最遠面）
      far: 30.0,
      // カメラの位置
      x: 8.0,
      y: 10.0,
      z: 3.0,
      // カメラの中止点
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }
  /**
   * レンダラー定義のための定数
   */
  static get RENDERER_PARAM() {
    return {
      // レンダラーが背景をリセットする際に使われる背景色
      clearColor: 0x4781E9,
      // レンダラーが描画する領域の横幅
      width: window.innerWidth,
      // レンダラーが描画する領域の縦幅
      height: window.innerHeight,
    };
  }
  /**
   * ディレクショナルライト定義のための定数
   */
  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xefefef, // 光の色
      intensity: 1.0,  // 光の強度
      x: 1.0,          // 光の向きを表すベクトルの X 要素
      y: 1.0,          // 光の向きを表すベクトルの Y 要素
      z: 1.0           // 光の向きを表すベクトルの Z 要素
    };
  }
  /**
   * アンビエントライト定義のための定数
   */
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 0.25,  // 光の強度
    };
  }

  /**
   * デフォルト用マテリアル
   */
  static get DEFAULT_MATERIAL_PARAM() {
    return {
      color: 0x2256F2, // マテリアルの基本色
    };
  }

  /**
   * 継続カウント用マテリアル
   */
  static get COUNTER_MATERIAL_PARAM() {
    return {
        color: 0xFFFFFF, //マテリアルの基本色
        wireframe: true,
    };
  }

  /**
   * 継続カウント(10桁)用マテリアル
   */
  static get TEN_COUNT_MATERIAL_PARAM() {
    return {
        color: 0xF27649, //マテリアルの基本色
    };
  }

  /**
   * 継続カウント用定数
   */
  static get COUNT_BOX_PARAM() {
    return {
        size: 0.3, //ジオメトリのサイズ
        position_y: 0, //y座標
    };
  }

  /**
   * 文字列の座標リスト
   */
  static get TEXT_POSITION() {
    return [
      //H
      [
        [-22,6],[-22,5],[-22,4],[-22,3],[-22,2],[-22,1],[-22,0],
        [-21,3],[-20,3],[-19,3],
        [-18,6],[-18,5],[-18,4],[-18,3],[-18,2],[-18,1],[-18,0],
      ],
      //E
      [
        [-16,3],[-16,2],[-16,1],[-16,0],
        [-15,4],[-15,2],[-15,0],
        [-14,4],[-14,2],[-14,0],
        [-13,4],[-13,3],[-13,0],
      ],
      //L
      [
        [-11,6],[-11,5],[-11,4],[-11,3],[-11,2],[-11,1],[-11,0]
      ],
      //L
      [
        [-9,6],[-9,5],[-9,4],[-9,3],[-9,2],[-9,1],[-9,0],
      ],
      //O
      [
        [-7,3],[-7,2],[-7,1],
        [-6,4],[-6,0],
        [-5,4],[-5,0],
        [-4,3],[-4,2],[-4,1],
      ],
      //,
      [
        [-3,-1],[-2,0],
      ],
      //W
      [
        [0,6],[0,5],[0,4],[0,3],[0,2],[0,1],[0,0],
        [1,1],[2,2],[2,3],[3,1],
        [4,6],[4,5],[4,4],[4,3],[4,2],[4,1],[4,0],
      ],
      //O
      [
        [6,3],[6,2],[6,1],
        [7,4],[7,0],
        [8,4],[8,0],
        [9,3],[9,2],[9,1],
      ],
      //R
      [
        [11,4],[11,3],[11,2],[11,1],[11,0],
        [12,2],
        [13,3],
      ],
      //L
      [
        [15,6],[15,5],[15,4],[15,3],[15,2],[15,1],[15,0],
      ],
      //D
      [
        [17,2],[17,1],[17,0],
        [18,3],[18,0],
        [19,3],[19,0],
        [20,6],[20,5],[20,4],[20,3],[20,2],[20,1],[20,0],
      ],
      //!
      [
        [22,6],[22,5],[22,4],[22,3],[22,2],[22,0],
      ],
    ];
  }

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.renderer;         // レンダラ
    this.scene;            // シーン
    this.camera;           // カメラ
    this.directionalLight; // ディレクショナルライト
    this.ambientLight;     // アンビエントライト
    this.textMaterial;         // テキスト用マテリアル
    this.textGeometry;    // テキスト用ジオメトリ
    this.counterMaterial;         // カウンター用マテリアル
    this.counterGeometry;    // カウンター用トーラスジオメトリ
    this.controls;         // オービットコントロール
    this.axesHelper;       // 軸ヘルパー
    this.counterArray;      // カウンター用リスト
    this.currentTensCount = 1;  //カウンター２桁目のカウント
    this.tensTmpCount = 1;  //カウンター2桁目_列の繰り上げ用
    this.tensLineCount = 1; //カウンター2桁目_列数のカウント
    this.isAnimationEnd = false; //gsapのアニメーション終了検知

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);

    // リサイズイベント
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, false);
  }

  /**
   * 初期化処理
   */
  init() {
    // レンダラー
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(new THREE.Color(App3.RENDERER_PARAM.clearColor));
    this.renderer.setSize(App3.RENDERER_PARAM.width, App3.RENDERER_PARAM.height);
    const wrapper = document.querySelector('#webgl');
    wrapper.appendChild(this.renderer.domElement);

    // シーン
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

    // テキスト用マテリアル
    this.textMaterial = new THREE.MeshPhongMaterial(App3.DEFAULT_MATERIAL_PARAM);

    // 共通のジオメトリ、マテリアルから、複数のメッシュインスタンスを作成する
    const TEXT_SIZE = 0.2;
    this.textGeometry = new THREE.BoxGeometry(TEXT_SIZE,TEXT_SIZE,TEXT_SIZE);
    App3.TEXT_POSITION.forEach(i => {
        i.forEach(elm => {
            const box = new THREE.Mesh(this.textGeometry, this.textMaterial);
            box.position.set(TEXT_SIZE*elm[0],TEXT_SIZE*elm[1] + 1,0);
             // シーンに追加する
            this.scene.add(box);
        });
    });

    //カウンター用インスタンス
    const MAX_COUNT = 10;
    let current_count = 0;
    if (typeof localStorage !== 'undefined') {
        if (localStorage.getItem('successCount')) {
            current_count = localStorage.getItem('successCount');
        }
      } 
    const TENS_COUNT = current_count / MAX_COUNT;
    const REMAINDER_COUNT = current_count % MAX_COUNT;

    let tmp = 1;
    this.counterArray = [];
    while(tmp <= MAX_COUNT){
        if(tmp <= REMAINDER_COUNT){
            this.counterMaterial = new THREE.MeshPhongMaterial(App3.DEFAULT_MATERIAL_PARAM);
        }else{
            this.counterMaterial = new THREE.MeshPhongMaterial(App3.COUNTER_MATERIAL_PARAM);
        }

        this.counterGeometry = new THREE.BoxGeometry(App3.COUNT_BOX_PARAM.size,App3.COUNT_BOX_PARAM.size,App3.COUNT_BOX_PARAM.size);
        
        const counterBox = new THREE.Mesh(this.counterGeometry, this.counterMaterial);
        
        counterBox.position.set(App3.COUNT_BOX_PARAM.size * (5 - tmp) * -2 - App3.COUNT_BOX_PARAM.size,App3.COUNT_BOX_PARAM.position_y,0);
    
        // シーンに追加する
        this.scene.add(counterBox);
        this.counterArray.push(counterBox);
        tmp++;
    }

    while(this.currentTensCount <= TENS_COUNT){    
        this.drawTensCounter();
    }
    
    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false;

    // ヘルパー
    // const axesBarLength = 5.0;
    // this.axesHelper = new THREE.AxesHelper(axesBarLength);
    //this.scene.add(this.axesHelper);
  }

  drawTensCounter() {
    if(this.tensTmpCount >= 11){
        this.tensTmpCount = 1;
        this.tensLineCount++;
    }

    this.counterMaterial = new THREE.MeshPhongMaterial(App3.TEN_COUNT_MATERIAL_PARAM);
    this.counterGeometry = new THREE.BoxGeometry(App3.COUNT_BOX_PARAM.size,App3.COUNT_BOX_PARAM.size,App3.COUNT_BOX_PARAM.size);
    
    const counterBox = new THREE.Mesh(this.counterGeometry, this.counterMaterial);

    counterBox.position.set(App3.COUNT_BOX_PARAM.size * (5 - this.tensTmpCount) * -2 - App3.COUNT_BOX_PARAM.size,App3.COUNT_BOX_PARAM.position_y - (App3.COUNT_BOX_PARAM.size * 2 * this.tensLineCount),0);

    // シーンに追加する
    this.scene.add(counterBox);
    this.tensTmpCount++;
    this.currentTensCount++;
  }

  /**
   * 描画処理
   */
  render() {
    // 恒常ループの設定
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * storageをチェック
   */
  checkStorage() {
    // localStorageの使用可否をチェックする
    if (typeof localStorage !== 'undefined') {
        // 特定のデータが存在するかどうかを確認する
        if (!localStorage.getItem('successCount')) {
        // データが存在しない場合に新しく作成する
        localStorage.setItem('successCount', 0);
        }
        return true;
    } else {
        window.alert('localStorageが利用不可のためカウント機能は停止します。');
        return false;
    }
  }

  /**
   * storageへのクリックイベントを初期化
   */
  setStorageEvent() {
    const countBtn = document.getElementById('js-countBtn');
    countBtn.addEventListener('click', () => {
        if(!this.isAnimationEnd){
            return;
        }
        let current_count = localStorage.getItem('successCount');
        current_count++;
        localStorage.setItem('successCount', current_count);
        let target = current_count % 10;
        if(target === 0){
            this.counterArray[9].material.wireframe = false;
            this.counterArray[9].material.color.setHex(App3.DEFAULT_MATERIAL_PARAM.color);
            this.drawTensCounter();
        }else if(target === 1){
            this.counterArray.forEach((element, index) => {
                if(index !== 0){
                    element.material.wireframe = true;
                    element.material.color.setHex(App3.COUNTER_MATERIAL_PARAM.color);    
                }else{
                    element.material.wireframe = false;
                    element.material.color.setHex(App3.DEFAULT_MATERIAL_PARAM.color);
                }
            });
        }else{
            this.counterArray[target - 1].material.wireframe = false;
            this.counterArray[target - 1].material.color.setHex(App3.DEFAULT_MATERIAL_PARAM.color);
        }
    });
   
  }

  animate(){
    gsap.to( this.camera.position, {
        duration: 2,
        y: 0,
        x: 0,
        z: 10,
        onComplete: () => { 
            this.controls.enabled = true; 
            this.isAnimationEnd = true;
        },
    } );
  }
}

