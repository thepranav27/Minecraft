import { Mat3, Mat4, Vec3, Vec4 } from "../lib/TSM.js";
import Rand from "../lib/rand-seed/Rand.js"

export class Chunk {
    private cubes: number; // Number of cubes that should be *drawn* each frame
    private cubePositionsF32: Float32Array; // (4 x cubes) array of cube translations, in homogeneous coordinates
    private x : number; // Center of the chunk
    private y : number;
    private size: number; // Number of cubes along each side of the chunk

    private heightMax: number;
    private typeOfBlock: number[];
    private seed: string;
    private octaves: number[][][];

    constructor(centerX : number, centerY : number, size: number) {
        this.x = centerX;
        this.y = centerY;
        this.size = size;
        this.cubes = size * size; 

        this.heightMax = 100.0;
        this.typeOfBlock = [];
        this.seed = this.genH(this.x, this.y).toString();
        this.octaves = [];
        this.octOne();
        this.octPop();
        this.generateChunks();
    }

    private generateChunks() {
        this.cubes = this.size * this.size;
        this.cubePositionsF32 = new Float32Array(4 * this.cubes);
        for(let i = 0; i < this.size; i++){
            for(let j = 0; j < this.size; j++){
                let h: number = 0;
                for(let k = 0; k < 3; k++){
                    h += 0.2 * this.bInter(i, j, 32 * Math.pow(1/2, k), this.octaves[k]);
                }
                h = Math.floor(h);
                if(h <= 10){
                    this.typeOfBlock.push(0);
                    h = 10;
                }
                else if(h <= 20) {
                    this.typeOfBlock.push(1)
                }
                else if(h <= 45) {
                    this.typeOfBlock.push(2);
                }
                else {
                    this.typeOfBlock.push(3);

                }
                this.cubePositionsF32[4 * (this.size * i + j)] = this.getTopLeftX() + j;
                this.cubePositionsF32[4 * (this.size * i + j) + 1] = h;
                this.cubePositionsF32[4 * (this.size * i + j) + 2] = this.getTopLeftZ() + i;
                this.cubePositionsF32[4 * (this.size * i + j) + 3] = 0;
            }
        }
    }

    public getTopLeftX(): number{
        return this.x - this.size / 2;
    }

    public getTopLeftZ(): number{
        return this.y - this.size / 2;
    }

    // Disclaimer: This function was mostly AI-Generated with some modifications
    private octPop() {
        const oct22: number[][] = this.octaves[0];
        let oct44: number[][] = [];
        let oct88: number[][] = [];

        for (let i = 0; i < 4; i++) {
            oct44.push([]);
            for(let j = 0; j < 4; j++){
                if (i % 2 == 0 && j % 2 == 0){
                    oct44[i].push(oct22[i/2][j/2]);
                    continue;
                }
                oct44[i].push(Math.floor(this.bInter(i, j, 2, oct22)));
            }
        }

        oct44.push([]);

        for(let i = 0; i < 5; i++) {
            if(i % 2 == 0) {
                oct44[4].push(oct22[2][i/2]);
                continue;
            }
            oct44[4].push(Math.floor((oct22[2][Math.floor(i/2)] + oct22[2][Math.ceil(i/2)]) / 2.0));
        }

        for(let i = 0; i < 4; i++) {
            if(i % 2 == 0) {
                oct44[i].push(oct22[i/2][2]);
                continue;
            }
            oct44[i].push(Math.floor((oct22[Math.floor(i/2)][2] + oct22[Math.ceil(i/2)][2]) / 2.0));
        }
        this.octaves.push(oct44);

        for(let i = 0; i < 8; i++){
            oct88.push([]);
            for(let j = 0; j < 8; j++){
                if(i % 2 == 0 && j % 2 == 0){
                    oct88[i].push(oct44[i/2][j/2]);
                    continue;
                }
                oct88[i].push(this.bInter(i, j, 2, oct44));
            }
        }
        oct88.push([]);

        for(let i = 0; i < 9; i++){
            if(i % 2 == 0){
                oct88[8].push(oct44[4][i/2]);
                continue;
            }
            oct88[8].push((oct44[4][Math.floor(i/2)] + oct44[4][Math.ceil(i/2)]) / 2.0);
        }

        for(let i = 0; i < 8; i++){
            if(i % 2 == 0){
                oct88[i].push(oct44[i/2][4]);
                continue;
            }
            oct88[i].push((oct44[Math.floor(i/2)][4] + oct44[Math.ceil(i/2)][4]) / 2.0);
        }

        this.octaves.push(oct88);
    }

    private bInter(x: number, y: number, len: number, octave: number[][]): number {
        return (1 - ((x % len) / len)) * (1 - ((y % len) / len)) * octave[Math.floor(x / len)][Math.floor(y / len)] + 
        ((x % len) / len) * (1 - ((y % len) / len)) * octave[Math.floor(x / len)+1][Math.floor(y / len)] + 
        (1 - ((x % len) / len)) * ((y % len) / len) * octave[Math.floor(x / len)][Math.floor(y / len)+1] + 
        ((x % len) / len) * ((y % len) / len) * octave[Math.floor(x / len) + 1][Math.floor(y / len) + 1];
    }

    private octOne() {
        let oct22: number[][] = [[],[],[]];
        
        let rand = new Rand(this.seed);
        for(let i = 0; i < 2; i++){
            for(let j = 0; j < 2; j++){
                oct22[i].push(Math.floor(this.heightMax * rand.next()));
            }
        }
        let rand2 = new Rand(this.genH(this.x + 64, this.y).toString());
        oct22[0].push(Math.floor(this.heightMax * rand2.next()));
        rand2.next();
        oct22[1].push(Math.floor(this.heightMax * rand2.next()));

        let rand3 = new Rand(this.genH(this.x, this.y + 64).toString());
        oct22[2].push(Math.floor(this.heightMax * rand3.next()));
        oct22[2].push(Math.floor(this.heightMax * rand3.next()));

        let rand4 = new Rand(this.genH(this.x + 64, this.y + 64).toString());
        oct22[2].push(Math.floor(this.heightMax * rand4.next()));
        this.octaves.push(oct22);
    }

    public type(): number[] {
        return this.typeOfBlock;
    }
    
    public cubePositions(): Float32Array {
        return this.cubePositionsF32;
    }
    
    public numCubes(): number {
        return this.cubes;
    }

    private genH(x: number, y: number): number {
        let h: number = (x << 4) + y;
        h += (h << 10);
        h ^= (h >> 6);
        h += (h << 3);
        h ^= (h >> 11);
        h += (h << 15);
        return h;  
    }
}