import { Debugger } from "../lib/webglutils/Debugging.js";
import {
  CanvasAnimation,
  WebGLUtilities
} from "../lib/webglutils/CanvasAnimation.js";
import { GUI } from "./Gui.js";
import {

  blankCubeFSText,
  blankCubeVSText
} from "./Shaders.js";
import { Mat4, Vec4, Vec3 } from "../lib/TSM.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
import { Camera } from "../lib/webglutils/Camera.js";
import { Cube } from "./Cube.js";
import { Chunk } from "./Chunk.js";

export class MinecraftAnimation extends CanvasAnimation {
  private gui: GUI;
  
  chunk : Chunk[];
  
  /*  Cube Rendering */
  private cubeGeometry: Cube;
  private blankCubeRenderPass: RenderPass;

  /* Global Rendering Info */
  private lightPosition: Vec4;
  private backgroundColor: Vec4;

  private canvas2d: HTMLCanvasElement;
  
  // Player's head position in world coordinate.
  // Player should extend two units down from this location, and 0.4 units radially.
  private playerPosition: Vec3;

  private oldX: number;
  private oldY: number;
  private oldTime: number;
  private timeOfDay: boolean;
  private ambient: number;
  private speed: number;
  private bgSpeed: number;
  private vel: number;
  private isInAir: boolean;
  private tp: boolean;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.canvas2d = document.getElementById("textCanvas") as HTMLCanvasElement;
  
    this.ctx = Debugger.makeDebugContext(this.ctx);
    let gl = this.ctx;
        
    this.gui = new GUI(this.canvas2d, this);
    this.playerPosition = this.gui.getCamera().pos();
    
    this.blankCubeRenderPass = new RenderPass(gl, blankCubeVSText, blankCubeFSText);
    this.cubeGeometry = new Cube();
    this.initBlankCube();
    
    this.lightPosition = new Vec4([-1000, 1000, -1000, 1]);
    this.backgroundColor = new Vec4([0.0, 0.749, 1.0, 1.0]);

    this.oldTime = performance.now() / 1000;
    this.timeOfDay = false;
    this.ambient = 1.0;
    this.speed = 100;
    this.bgSpeed = 50;
    this.vel = 0;
    this.isInAir = true;
    this.tp = false;
  }

  public turnTP() {
    this.tp = !this.tp;
  }

  public swapTime(){
    this.timeOfDay = !this.timeOfDay;
  }

  public updateSpeed(delta: number){
    this.speed = this.speed * delta;
  }

  private load(x: number, y: number) {
    if(x == this.oldX && y == this.oldY) {
      return;
    }
    this.chunk = [];
    for(let i = 0; i <= 2; i++){
      for(let j = 0; j <= 2; j++){
        this.chunk.push(new Chunk((64 * (i - 1)) + x, (64 * (j - 1)) + y, 64));
      }
    }
    this.oldX = x;
    this.oldY = y;
  }

  /**
   * Setup the simulation. This can be called again to reset the program.
   */
  public reset(): void {    
      this.gui.reset();
      this.timeOfDay = false;
      this.tp = false;
      this.ambient = 1.0;
      this.speed = 100;
      this.playerPosition = this.gui.getCamera().pos();
      this.backgroundColor = new Vec4([0.0, 0.749, 1.0, 1.0]);
      this.load(0, 0);
  }
  
  /**
   * Sets up the blank cube drawing
   */
  private initBlankCube(): void {
    this.blankCubeRenderPass.setIndexBufferData(this.cubeGeometry.indicesFlat());
    this.blankCubeRenderPass.addAttribute("aVertPos",
      4,
      this.ctx.FLOAT,
      false,
      4 * Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      this.cubeGeometry.positionsFlat()
    );
    
    this.blankCubeRenderPass.addAttribute("aNorm",
      4,
      this.ctx.FLOAT,
      false,
      4 * Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      this.cubeGeometry.normalsFlat()
    );
    
    this.blankCubeRenderPass.addAttribute("aUV",
      2,
      this.ctx.FLOAT,
      false,
      2 * Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      this.cubeGeometry.uvFlat()
    );
    
    this.blankCubeRenderPass.addInstancedAttribute("aOffset",
      4,
      this.ctx.FLOAT,
      false,
      4 * Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      new Float32Array(0)
    );

    this.blankCubeRenderPass.addInstancedAttribute("aType",
      1,
      this.ctx.FLOAT,
      false,
      1 * Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      new Float32Array(0)
    );

    this.blankCubeRenderPass.addInstancedAttribute("aTime",
      1,
      this.ctx.FLOAT,
      false,
      1 * Float32Array.BYTES_PER_ELEMENT,
      0,
      undefined,
      new Float32Array(0)
    );

    this.blankCubeRenderPass.addUniform("uLightPos",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniform4fv(loc, this.lightPosition.xyzw);
    });
    this.blankCubeRenderPass.addUniform("uProj",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.projMatrix().all()));
    });
    this.blankCubeRenderPass.addUniform("uView",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.viewMatrix().all()));
    });
    this.blankCubeRenderPass.addUniform("uAmb",
      (gl: WebGLRenderingContext, loc: WebGLUniformLocation) => {
        gl.uniform1f(loc, this.ambient);
    });
    
    this.blankCubeRenderPass.setDrawData(this.ctx.TRIANGLES, this.cubeGeometry.indicesFlat().length, this.ctx.UNSIGNED_INT, 0);
    this.blankCubeRenderPass.setup();    
  }

  /**
   * Draws a single frame
   *
   */
  public draw(): void {
    let x: number = this.playerPosition.x;
    let z: number = this.playerPosition.z;

    let pHeight = this.playerPosition.y - 2;
    let time = performance.now() / 1000 - this.oldTime;
    this.oldTime = performance.now() / 1000;

    if(this.chunk){
      let curHeight = this.chunk[4].cubePositions()[(Math.floor(z - this.chunk[4].getTopLeftZ()) * 64 + Math.floor(x - this.chunk[4].getTopLeftX())) * 4 + 1];
      if (this.isInAir) {
        pHeight += this.vel * time;
        this.vel -= 9.8 * time;

        if (pHeight < curHeight) {
          pHeight = curHeight;
          this.vel = 0;
          this.isInAir = false;
        }
        this.playerPosition.add(this.gui.walkDir());
        this.playerPosition.y = pHeight + 2;
        this.gui.getCamera().setPos(this.playerPosition);
      }
      else {
        this.vel = 0;
      }
      let movedPos = Vec3.sum(this.playerPosition, this.gui.walkDir());
      let secIndex = 4;
      if(Vec3.sum(this.playerPosition, this.gui.walkDir().scale(1.4)).x < this.chunk[4].getTopLeftX()) {
        if(Vec3.sum(this.playerPosition, this.gui.walkDir().scale(1.4)).z >= this.chunk[4].getTopLeftZ() + 64){
          secIndex = 2;
        }
        else if(Vec3.sum(this.playerPosition, this.gui.walkDir().scale(1.4)).z < this.chunk[4].getTopLeftZ()){
          secIndex = 0;
        }
        else{
          secIndex = 1;
        }
      }
      else if (Vec3.sum(this.playerPosition, this.gui.walkDir().scale(1.4)).x >= this.chunk[4].getTopLeftX() + 64){
        if(Vec3.sum(this.playerPosition, this.gui.walkDir().scale(1.4)).z >= this.chunk[4].getTopLeftZ() + 64){
          secIndex = 8;
        }
        else if(Vec3.sum(this.playerPosition, this.gui.walkDir().scale(1.4)).z < this.chunk[4].getTopLeftZ()){
          secIndex = 6;
        }
        else{
          secIndex = 7;
        }
      }
      else{
        if(Vec3.sum(this.playerPosition, this.gui.walkDir().scale(1.4)).z < this.chunk[4].getTopLeftZ()){
          secIndex= 3;
        }
        else if(Vec3.sum(this.playerPosition, this.gui.walkDir().scale(1.4)).z >= this.chunk[4].getTopLeftZ()+64){
          secIndex = 5;
        }
      } 
      let iVal = (Math.floor(Vec3.sum(this.playerPosition, this.gui.walkDir().scale(1.4)).z - this.chunk[secIndex].getTopLeftZ()) * 64 + Math.floor(Vec3.sum(this.playerPosition, this.gui.walkDir().scale(1.4)).x - this.chunk[secIndex].getTopLeftX())) * 4 + 1;
      let neighborHeight = this.chunk[secIndex].cubePositions()[iVal];
      if (neighborHeight <= pHeight) {
        this.playerPosition = movedPos;
        this.gui.getCamera().setPos(this.playerPosition);
        if(neighborHeight < pHeight){
          this.isInAir = true;   
        }
      }
    }
    else {
      this.playerPosition.add(this.gui.walkDir());
      this.gui.getCamera().setPos(this.playerPosition);
    }

    if (this.timeOfDay) {
      if((this.lightPosition.y >= 1000) || (this.lightPosition.y <= 0)){
        this.bgSpeed =- this.bgSpeed;
        this.speed =- this.speed;
      }
      this.lightPosition.x -= this.speed * time;
      this.lightPosition.y += this.speed * time;
      this.lightPosition.z -= this.speed * time;
      this.ambient = (this.lightPosition.y + 10) / 1050;
    }
    
    // Drawing
    const gl: WebGLRenderingContext = this.ctx;
    let bg: Vec4 = this.backgroundColor;
    if(this.timeOfDay){
      this.backgroundColor.y = (1200 - this.lightPosition.y) / 1200 *  0.749;
      this.backgroundColor.z = (1200 - this.lightPosition.y) / 1200 * 0.749;
    }
    gl.clearColor(bg.r, bg.g, bg.b, bg.a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null); 
    this.drawScene(x, z, 1280, 960);        
  }

  private drawScene(x: number, y: number, width: number, height: number): void {
    const gl: WebGLRenderingContext = this.ctx;
    gl.viewport(0, 0, width, height);
    x = Math.floor((x + 32) / 64) * 64;
    y = Math.floor((y + 32) / 64) * 64;
    this.load(x, y);

    //TODO: Render multiple chunks around the player, using Perlin noise shaders
    let bTypes: number[] = [];
    let bTimes: number[] = [];
    let bList: number[] = [];
    let time = 50.0;
    if (this.tp) {
      time = Math.floor(performance.now() / 1000);
    }
    let c: number = 0;
    for(let i = 0; i < this.chunk.length; i++){
      c += this.chunk[i].numCubes();
      for(let j = 0; j < this.chunk[i].cubePositions().length; j++){
        bList.push(this.chunk[i].cubePositions()[j]);
        bTimes.push(time);
      }
      for(let j = 0; j < this.chunk[i].type().length; j++){
        bTypes.push(this.chunk[i].type()[j]);
      }
    }
    c += this.gFill(bList, bTypes);

    const blocks = new Float32Array(bList);
    const types = new Float32Array(bTypes);
    const times = new Float32Array(bTimes);

    this.blankCubeRenderPass.updateAttributeBuffer("aOffset", blocks);
    this.blankCubeRenderPass.updateAttributeBuffer("aType", types);
    this.blankCubeRenderPass.updateAttributeBuffer("aTime", times);

    this.blankCubeRenderPass.drawInstanced(c);    
  }

  private gFill(blocks: number[], types: number[]): number {
    let bList = blocks.slice();
    let c = 0;

    for(let i = 1; i < bList.length; i += 4){
      if(((i - 1) / 192) + 1 % 192 != 0) {
        if(Math.abs(bList[i] - bList[i+4]) > 1) {
          let higher;
          if (bList[i] > bList[i + 4]) {
              higher = i;
          } else {
              higher = i + 4;
          }
          let sub = Math.abs(bList[i] - bList[i+4]) - 1;
          while(sub != 0) {
            let height = bList[higher] - sub;
            blocks.push(bList[higher - 1]);
            blocks.push(height);
            blocks.push(bList[higher + 1]);
            blocks.push(bList[higher + 2]);
            --sub;

            if(height <= 10) {
              types.push(0);
            }
            else if(height <= 20) {
              types.push(1)
            }
            else if(height <= 45) {
              types.push(2);
            }
            else {
              types.push(3);
            }
            c++;
          }
        }
      }
      if((i + 192 * 4) < bList.length) {
        if(Math.abs(bList[i] - bList[(i + 192 * 4)]) > 1) {
          let higher;
          if (bList[i] > bList[(i + 192 * 4)]) {
              higher = i;
          } else {
              higher = i + 192 * 4;
          }
          let sub = Math.abs(bList[i] - bList[(i + 192 * 4)]) - 1;
          while(sub != 0) {
            let height = bList[higher] - sub;
            blocks.push(bList[higher - 1]);
            blocks.push(height);
            blocks.push(bList[higher + 1]);
            blocks.push(bList[higher + 2]);
            --sub;
            if(height <= 10) {
              types.push(0);
            }
            else if(height <= 20) {
              types.push(1)
            }
            else if(height <= 45) {
              types.push(2);
            }
            else {
              types.push(3);
            }
            c++;
          }
        }
      }
    }
    return c;
  }

  public getGUI(): GUI {
    return this.gui;
  }  
  
  public jump() {
      if(!this.isInAir) {
        this.isInAir = true;
        this.vel = 10;
      }
  }
}

export function initializeCanvas(): void {
  const canvas = document.getElementById("glCanvas") as HTMLCanvasElement;
  /* Start drawing */
  const canvasAnimation: MinecraftAnimation = new MinecraftAnimation(canvas);
  canvasAnimation.start();  
}
