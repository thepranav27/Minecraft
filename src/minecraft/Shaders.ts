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
        wsPos = aVertPos + aOffset;
        normal = normalize(aNorm);
        type = aType;
        time = aTime;
        offset = aOffset.xz;
        uv = aUV;
    }
`;

export const blankCubeFSText = `
    precision mediump float;

    uniform vec4 uLightPos;
    uniform float uAmbient;
    
    varying vec4 normal;
    varying vec4 wsPos;
    varying vec2 uv;
    varying float type;
    varying vec2 offset;
    varying float time;

    float random(in vec2 pt, in float seed) {
        return fract(sin( (seed + dot(pt.xy, vec2(12.9898,78.233))))*43758.5453123);
    }

    vec2 unit_vec(in vec2 xy, in float seed) {
        float theta = 6.28318530718*random(xy, seed);
        return vec2(cos(theta), sin(theta));
    }

    float smoothmix(float a0, float a1, float w) {
        return (a1 - a0) * (3.0 - w * 2.0) * w * w + a0;
    }

    float perlin(in float seed, in float factor) {
        vec2 gridPos = floor(uv * factor);
        vec2 localUV = fract(uv * factor);
        float uBlend = smoothmix(0.0, 1.0, localUV.x);
        float vBlend = smoothmix(0.0, 1.0, localUV.y);
        float total = 0.0;
    
        for (int j = 0; j <= 1; j++) {
            for (int i = 0; i <= 1; i++) {
                vec2 offset = vec2(float(i), float(j));
                vec2 cellPos = gridPos + offset;
                vec2 localOffset = offset - localUV;
                vec2 randVec = unit_vec(cellPos, seed);
                float contribution = dot(randVec, localOffset);
                float weight = (i == 0 ? (1.0 - uBlend) : uBlend) * (j == 0 ? (1.0 - vBlend) : vBlend);
                total += weight * contribution;
            }
        }
    
        return (total + 1.0) / 2.0;
    }
    
    void main() {
        vec3 kd = vec3(1.0, 1.0, 1.0);
        vec3 ka = uAmbient * vec3(0.1, 0.1, 0.1);

        if(type == 0.0){
            kd = vec3(0.2, 0.4, 0.8);
        }else if(type == 1.0){
            kd = vec3(0.2, 0.8, 0.2);
        }else if(type == 2.0) {
            kd = vec3(0.6, 0.4, 0.2);
        }

        float seed = random(offset, time);

        float n1 = perlin(seed, 5.0);
        float n2 = perlin(seed, 10.0);
        float n3 = perlin(seed, 15.0);

        float c1 = 0.5;
        float c2 = 0.25;
        float c3 = 0.125;

        float noise = n1 * c1 + n2 * c2 + n3 * c3;

        float factor = noise;

        if(type == 0.0){
            // noise
            kd.z *= (noise * 2.5);
            factor = sin(uv.x + uv.y + noise);
        }else if(type == 1.0){
            factor = sin(sqrt((uv.x - 0.5) * (uv.x - 0.5) + (uv.y - 0.5) * (uv.y - 0.5)) + noise);
        }else if(type == 2.0) {
            // kd = vec3(0.6, 0.4, 0.2);
        }else if(type == 3.0) {
            noise = n1 * 4.0;
            factor = noise;
        }

        /* Compute light fall off */
        vec4 lightDirection = uLightPos - wsPos;
        float dot_nl = dot(normalize(lightDirection), normalize(normal));
	    dot_nl = clamp(dot_nl, 0.0, 1.0);
	
        gl_FragColor = vec4(clamp(ka + dot_nl * kd * factor, 0.0, 0.9), 1.0);
    }
`;