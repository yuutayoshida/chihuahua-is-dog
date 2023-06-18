import * as THREE from 'three';

export class Fan extends THREE.Group {
    constructor(
        material,
        size,
        wingNumbers,
    ){
        super();

        this.material = material;
        this.size = size;
        this.wingNumbers = wingNumbers;
        this.fanGroup;
        this.wingHeight = size * 0.8;
        
        //フレーム
        const frame = new THREE.Mesh(
            new THREE.TorusGeometry(this.size, this.size * 0.1),
            this.material
        );
        frame.position.set(0.0,0.0,0.0);
        this.add(frame);

        // 軸
        const pivot = new THREE.Mesh(
            new THREE.CylinderGeometry(
                this.size * 0.15, 
                this.size * 0.2, 
                this.size * 0.1
            ),
            this.material
        );
        pivot.position.set(0.0,0.0,0.0);
        pivot.rotation.x = (90.0 * Math.PI) / 180;
        this.add(pivot);

        //プロペラ
        this.createWing(this.wingNumbers);
    }

    // プロペラの生成
    // 初期化時とGUIから呼び出される
    createWing(wingNumbers){
        //２回目以降の呼び出しの際は、羽のグループをリセットする
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i] === this.fanGroup) {
                this.remove(this.fanGroup);
            }
        }

        this.fanGroup = new THREE.Group();
        this.fanGroup.position.set(0.0, 0.0, 0.0);

        const thetaLength = (360 / (wingNumbers * 2) * Math.PI) / 180;
        for(let i = 1; i <= wingNumbers; i++){
			const thetaStart = (360 / wingNumbers * Math.PI) / 180 * i;
			const wingGeometry = new THREE.CircleGeometry(
                this.wingHeight,
				32,
				thetaStart,
				thetaLength,
			);
			this.fanGroup.add(
                new THREE.Mesh(wingGeometry, 
                new THREE.MeshToonMaterial({color: 0xd4d6db,})
            ));
        }

        this.add(this.fanGroup);        
    }

    // プロペラの回転
    rotateWing(){
        this.fanGroup.rotation.z += 0.1;
    }
}