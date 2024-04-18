export const blankCubeVSText = `
    precision mediump float;

    uniform vec4 uLightPos;    
    uniform mat4 uView;
    uniform mat4 uProj;
    
    attribute vec4 aNorm;
    attribute vec4 aVertPos;
    attribute vec4 aOffset;
    attribute vec2 aUV;
    attribute float aType;
    attribute float aTime;
    
    varying float type;
    varying vec2 offset;
    varying float time;
    varying vec4 normal;
    varying vec4 wsPos;
    varying vec2 uv;

    void main () {
        gl_Position = uProj * uView * (aVertPos + aOffset);
        type = aType;
        time = aTime;
        offset = aOffset.xz;
        wsPos = aVertPos + aOffset;
        normal = normalize(aNorm);
        uv = aUV;
    }
`;

export const blankCubeFSText = `
    precision mediump float;

    uniform vec4 uLightPos;
    varying vec4 normal;
    varying vec4 wsPos;
    varying vec2 uv;
    uniform float uAmbient;
    varying float type;
    varying vec2 offset;
    varying float time;

    float random(in vec2 pt, in float seed) {
        return fract(sin((dot(pt.xy, vec2(12.9898,78.233) + seed))) * 43758.5453123);
    }

    vec2 unitVector(in vec2 xy, in float seed) {
        float theta = 6.28318530718 * random(xy, seed);
        return vec2(cos(theta), sin(theta));
    }

    float smoothInter(float a0, float a1, float w) {
        return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;
    }

    float pNoise(in float seed, in float factor) {
        vec2 gridPos = floor(uv * factor);
        vec2 localUV = fract(uv * factor);
        float blendX = smoothInter(0.0, 1.0, localUV.x);
        float blendY = smoothInter(0.0, 1.0, localUV.y);
        float total = 0.0;
    
        for (int j = 0; j <= 1; j++) {
            for (int i = 0; i <= 1; i++) {
                vec2 offset = vec2(float(i), float(j));
                vec2 cellPos = gridPos + offset;
                float weight = (i == 0 ? (1.0 - blendX) : blendX) * (j == 0 ? (1.0 - blendY) : blendY);
                total += weight * dot(unitVector(cellPos, seed), offset - localUV);
            }
        }
    
        return (total + 1.0) / 2.0;
    }
    
    void main() {
        vec3 baseColor = vec3(1.0, 1.0, 1.0);
        vec3 ka = uAmbient * vec3(0.1, 0.1, 0.1);

        if(type == 0.0){
            baseColor = vec3(0.2, 0.4, 0.8);
        }else if(type == 1.0){
            baseColor = vec3(0.2, 0.8, 0.2);
        }else if(type == 2.0) {
            baseColor = vec3(0.6, 0.4, 0.2);
        }

        float seed = random(offset, time);

        float noise = pNoise(seed, 5.0) * 0.5 + pNoise(seed, 10.0) * 0.25 + pNoise(seed, 15.0) * 0.125;

        float lightInt = noise;

        if (type == 0.0){
            baseColor.z *= (noise * 2.5);
            lightInt = sin(uv.x + uv.y + noise);
        }
        else if (type == 1.0){
            lightInt = sin(sqrt((uv.x - 0.5) * (uv.x - 0.5) + (uv.y - 0.5) * (uv.y - 0.5)) + noise);
        }
        else if (type == 3.0) {
            noise = pNoise(seed, 5.0) * 4.0;
            lightInt = noise;
        }

        vec4 lightDirection = uLightPos - wsPos;
        float dNorm = dot(normalize(lightDirection), normalize(normal));	
        gl_FragColor = vec4(clamp(uAmbient * vec3(0.1, 0.1, 0.1) + clamp(dNorm, 0.0, 1.0) * baseColor * lightInt, 0.0, 0.9), 1.0);
    }
`;
