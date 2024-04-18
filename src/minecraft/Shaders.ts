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
    uniform float uAmb;
    varying float type;
    varying vec2 offset;
    varying float time;

    // Function to generate a random float based on position and seed
    float random(vec2 pt, float seed) {
        return fract(sin(dot(pt, vec2(12.9898, 78.233)) + seed) * 43758.5453123);
    }

    // Function to generate a unit vector from a random angle
    vec2 unitVector(vec2 xy, float seed) {
        float theta = 6.28318530718 * random(xy, seed);
        return vec2(cos(theta), sin(theta));
    }

    // Smooth interpolation between a0 and a1
    float smoothInterpolate(float a0, float a1, float w) {
        return mix(a0, a1, w * w * (3.0 - 2.0 * w));
    }

    // Perlin noise function
    float perlinNoise(float seed, float scale) {
        vec2 gridPos = floor(uv * scale);
        vec2 localUV = fract(uv * scale);
        float blendX = smoothInterpolate(0.0, 1.0, localUV.x);
        float blendY = smoothInterpolate(0.0, 1.0, localUV.y);
        float total = 0.0;

        for (int j = 0; j <= 1; ++j) {
            for (int i = 0; i <= 1; ++i) {
                vec2 offset = vec2(float(i), float(j));
                vec2 cellPos = gridPos + offset;
                vec2 cellVec = unitVector(cellPos, seed);
                float weight = dot(cellVec, offset - localUV);
                total += mix(1.0 - blendX, blendX, float(i)) * mix(1.0 - blendY, blendY, float(j)) * weight;
            }
        }
        return (total + 1.0) / 2.0;
    }

    void main() {
        vec3 baseColor = vec3(1.0, 1.0, 1.0);
        if (type == 0.0) {
            baseColor = vec3(0.2, 0.4, 0.8);
        } else if (type == 1.0) {
            baseColor = vec3(0.2, 0.8, 0.2);
        } else if (type == 2.0) {
            baseColor = vec3(0.6, 0.4, 0.2);
        }

        float seed = random(offset, time);
        float noise = perlinNoise(seed, 5.0) * 0.5 + perlinNoise(seed, 10.0) * 0.25 + perlinNoise(seed, 15.0) * 0.125;

        float lightIntensity = 1.0;
        if (type == 0.0) {
            lightIntensity = sin(uv.x + uv.y + noise);
        } else if (type == 1.0) {
            lightIntensity = sin(sqrt(dot(uv - 0.5, uv - 0.5)) + noise);
        } else if (type == 3.0) {
            noise *= 4.0;
            lightIntensity = noise;
        }

        vec4 lightDir = uLightPos - wsPos;
        float lightEffect = max(dot(normalize(lightDir), normalize(normal)), 0.0);

        vec3 ambient = uAmb * vec3(0.1, 0.1, 0.1);
        vec4 color = vec4(clamp(ambient + lightEffect * baseColor * lightIntensity, 0.0, 0.9), 1.0);

        gl_FragColor = color;
    }
`;