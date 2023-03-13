#version 330 core

uniform samplerCube cubmapTexture;

uniform vec2 iResolution;
uniform float iTime;
uniform int iFrame;
in vec2 fragCoord; 
out vec4 fragColor;

// ray struct
struct viewRay {
    vec3 ori;
    vec3 dir;
};

/* GLOBAL VARIABLES */

// initialize camera position and viewing angles
const vec3 camPosition = vec3(-2.226, 1.3, -1.536);
vec2 camRotation = vec2(0.3, 0.9668);

// set ocean color and speed
vec3 oceanColor = vec3(0,.06,.06);
float oceanSpeed = 10*iTime;

vec3 ballCenter;
const float PI = 3.1415926535;

/* MISC */

// make ball bob up and down over time and move it forward in z
void moveBall() {
	// control height and speed of ball bobbing
	float period = 30;
	float amplitude = 0.08; 

	// set ball position
	vec3 v = vec3(0,0.3,5);

	// move ball forward in z
	v.z -= 2.5*iTime;

	// move ball up and down
	ballCenter = v + amplitude * sin(period*iTime);
}

// from assignment a5
vec3 gamma2(vec3 col) {
    return vec3(sqrt(col.r), sqrt(col.g), sqrt(col.b));
}

/* NOISE FUNCTIONS */

// sample hash function from shadertoy (https://www.shadertoy.com/view/4sKSzw)
vec4 hash42(vec2 p) {   
    p -= floor(p / 289.0) * 289.0;
    p += vec2(223.35734, 550.56781);
    p *= p;
    float xy = p.x * p.y;
    return vec4(fract(xy * 0.00000012), fract(xy * 0.00000543), fract(xy * 0.00000192), fract(xy * 0.00000423));
}

// generates perlin noise using bilinear interpolation
vec2 perlinNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);

	vec4 noise = mix( 
		mix(hash42((i.xy + vec2(0.0,0.0))), hash42((i.xy + vec2(1.0,0.0))), f.x),
		mix(hash42((i.xy + vec2(0.0,1.0))), hash42((i.xy + vec2(1.0,1.0))), f.x),
		f.y);

	return mix(vec2(noise.y, 0), noise.xz, f.z);
}

// generates perlin noise at various octaves using various transformations at each
float noiseOctave(vec3 v, int octaves, float scale, float multiplySum, float multiplyPosition, int waveType, bool rotate) {
	float sum = 0.0;

	// scale and move the noise over time
	v *= scale;
	v += oceanSpeed * vec3(0,.1,.1);

	for (int i = 0; i < octaves; i++) {
		sum *= multiplySum;

		// rotate the noise by 45 degrees
		if (rotate) {
			v = (v.yzx + v.zyx * vec3(1,-1,1))/sqrt(2.0);
		}

		// increment sum based on type of wave
		if (waveType == 1) {
			sum += 4 * abs(perlinNoise(v).x - 0.5);
		}
		if (waveType == 2) {
			sum += sqrt(pow(perlinNoise(v).x - 0.5, 2.0) + .01) * 1.85;
		}
		v *= multiplyPosition;
	}
	sum /= exp2(octaves);
	
	return 0.5-sum;
}

float waveLower(vec3 pos) {
	return noiseOctave(pos, 8, 0.3, 1.75, 2.0, 1, true)/2.0;
}

float waveHigher(vec3 pos) {
	return noiseOctave(pos, 8, 0.2, 1.0, 2.0, 2, true);
}

/* RAY MARCHING & TRACING FUNCTIONS */

viewRay getRay(vec2 thetas, vec2 fragCoord) {
	// cosines and sines of rotation angles...
    vec2 cosines = vec2(cos(thetas.x), cos(thetas.y));
	vec2 sines = vec2(sin(thetas.x), sin(thetas.y));
    
	// create ray
    vec3 tempRay;
    tempRay.xy = fragCoord.xy - iResolution.xy*.5;
	tempRay.z = iResolution.y - 50;
	tempRay = normalize(tempRay);
    
	// rotate ray by theta_x about x axis
   	tempRay.yz = vec2(tempRay.y*cosines.x, tempRay.z*cosines.x)+ vec2(-tempRay.z*sines.x, tempRay.y*sines.x);
	// rotate ray by theta_y about y axis
	tempRay.xz = vec2(tempRay.x*cosines.y, tempRay.z*cosines.y)+ vec2(tempRay.z*sines.y, -tempRay.x*sines.y);
	
	return viewRay(camPosition, tempRay.xyz);
}

// ray trace beachball (used optimized signed distance function)
float traceBall(vec3 rayOri, vec3 rayDir) {
	// generate ray from ray origin to ball center
	vec3 center = ballCenter;
	center -= rayOri;

	// distance between ray origin and ball center
	float t = dot(center,rayDir); 

	// distance between ball center and intersection point of the ray with the ball
	float p = length(center-t*rayDir);
	// ball radius
	float radius = 0.7; 

	// ray misses ball
	if (radius < p)
		return 0.0;

	// t value if ray intersects ball
	return t-sqrt(pow(radius,2)-pow(p,2));
}

// vertical distance from ray origin to ocean surface
float getOceanDist(vec3 rayOri) {
	return rayOri.y - waveLower(rayOri);
}

// ray march ocean surface
float traceOcean(vec3 rayOri, vec3 rayDir) {
	// distance to ocean surface
	float distToOcean = 0.1;
	float t = 0.0; 

	for (int i=0; i < 90; i++) {
		// exit loop if distance to surface is very small or we've traveled too far
		if (distToOcean < .01 || t > 90.0) 
			break;

		distToOcean = getOceanDist(t * rayDir + rayOri);
		// increment distance traveled
		t += distToOcean; 
	}	
	// ray misses ocean
	if (distToOcean > .1) {
		return 0.0;
	}
	return t;
}

/* SHADING FUNCTIONS */

// sample from skybox color
vec3 shadeSky(vec3 rayDir) {
	return (texture(cubmapTexture, rayDir)).rgb;
}

// shades beachball
vec3 shadeBall(vec3 intersectionPoint, vec3 rayDir) {
	intersectionPoint -= ballCenter;

    float radius = sqrt(pow(intersectionPoint.x,2) + pow(intersectionPoint.y,2) + pow(intersectionPoint.z, 2));
    float phi = atan(-intersectionPoint.z, intersectionPoint.x) + PI;

	// longitude component
    float u = phi / (2.0 * PI); 

    // divide longitude into six sections
    float section = mod(floor((u * 6.0) + iTime * 5),6.0);

	// default color white
	vec3 col = vec3(1.0, 1.0, 1.0);

    if (section == 1.0) {
        col = vec3(1.0, 0.0, 0.0); // red band
    }
    else if (section == 3.0) {
        col = vec3(0.0, 0.0, 1.0); // blue band
    }
    else if (section == 5.0) {
        col = vec3(0.0, 1.0, 0.0); // green band
    }

	// get surface normal
	vec3 normal = normalize(intersectionPoint); 

	// hardcoded light position
	vec3 lightPos = vec3(-2,3,0); 
	float ndotl = dot(normal,lightPos);
	
	vec3 i_a = col * 1.2;
	vec3 i_d = col * 1.5;
	vec3 i_s = col * 0.4;

	const float k_a = 0.2;
	const float k_d = 0.5;
	const float k_s = 0.3;

	const float p = 5.;

	// ambient term
	vec3 ambient = k_a * i_a;

	// diffusive term
	vec3 l_j = normalize(lightPos - intersectionPoint);
	float lambert = max(0.001, dot(normal,l_j));
	vec3 diffuse = k_d * i_d * col.rgb * lambert;

	// specular term
	vec3 v = normalize(camPosition - intersectionPoint);
	vec3 r = reflect(-l_j,normal);
	float spec = pow(max(0, dot(v, r)),p);
	vec3 specular = k_s * i_s * spec;

	col = diffuse + ambient + specular;

	float ndotr = dot(rayDir,normal); 
	vec3 reflectedRay = rayDir-2.0*ndotr*normal; 

	// reflection color interpolates between sky and ocean color based on y-component of reflection ray
	vec3 reflection = mix(oceanColor, shadeSky(reflectedRay), smoothstep(-0.2, 0.2, reflectedRay.y));

	// schlick's approximation for fresnel term
	float r0 = pow(((1.0-1.35)/(1.0+1.35)),2.0);
	float fresnel = r0+(1-r0)*(pow(1.0-abs(ndotr),5.0));

	col = mix(col,reflection,fresnel);
	
	return col;
}

// refract ray (from OpenGL docs)
vec3 refractRay(vec3 rayDir, vec3 normal, float eta) {
	float k = 1.0 - eta * eta * (1.0 - dot(normal, rayDir) * dot(normal, rayDir));
    if (k < 0.0) {
        return vec3(0.,0.,0.);
	}
	return vec3(eta * rayDir - (eta * dot(normal, rayDir) + sqrt(k)) * normal);
}

// get surface normal of ocean using finite difference approximation
vec3 getOceanNormal(vec3 pt) {
	vec3 normal = vec3(0.,0.,0.);
	float d = 0.02*length(pt);
	
	normal.x = getOceanDist(pt+vec3(d,0.,0.))-getOceanDist(pt-vec3(d,0.,0.));
	normal.y = getOceanDist(pt+vec3(0.,d,0.))-getOceanDist(pt-vec3(0.,d,0.));
	normal.z = getOceanDist(pt+vec3(0.,0.,d))-getOceanDist(pt-vec3(0.,0.,d));

	return normalize(normal);
}

// shades ocean
vec3 shadeOcean(vec3 intersectionPoint, vec3 rayDir) {
	// get surface normal at intersection point
	vec3 n = getOceanNormal(intersectionPoint); 
	float ndotr = dot(rayDir,n); 
	
	// reflection and refraction rays based on surface normal and viewing ray
	vec3 reflectedRay = rayDir-2.0*ndotr*n; 
	// using water and air IORs
	vec3 refractedRay = refractRay(normalize(rayDir), normalize(n), 1.0/1.33);
	
	// default color of reflection is the sky color
	vec3 reflection = shadeSky(reflectedRay);
	float t = traceBall(intersectionPoint, reflectedRay);
	if (t > 0.0) {
		reflection = shadeBall(intersectionPoint, reflectedRay);
	}

	// default color of refraction is the ocean color
	vec3 refraction = oceanColor;
	// if refraction hits the ball, interpolate between the ball color and the ocean color based on t value
	// the further away the ball is underwater, the more ocean color is used
	t = traceBall(intersectionPoint, refractedRay);
	if (t > 0.0) {
		refraction = mix(refraction, shadeBall(intersectionPoint, refractedRay), exp2(-t));
	}
	
	// mixes reflection and refraction colors based on fresnel term
	// uses schlick's approximation
	float r0 = pow(((1.0-1.33)/(1.0+1.33)),2.0);
	float fresnel = r0+(1-r0)*(pow(1.0-abs(ndotr),5.0));

	vec3 col = mix(refraction, reflection, fresnel);
	
	return col;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
	// begin ball animation
	moveBall();

	// get ray from camera
    viewRay r = getRay(camRotation, fragCoord);
	
	// trace ray for ball and ocean
	float t_O = traceOcean(r.ori, r.dir);
	float t_B = traceBall(r.ori, r.dir);

	// default color is sky color
	vec3 result = shadeSky(r.dir * vec3(0.25,1,0.08));

	// if ray hits ocean first, use ocean color
	if (t_O > 0.0 && (t_O < t_B || t_B == 0.0)) {
		vec3 intersectionPoint = r.dir*t_O + r.ori;
		result = shadeOcean(intersectionPoint, r.dir);
	}
	// if ray hits ball first, use ball color
	else if (t_B > 0.0) {
		vec3 intersectionPoint = r.dir*t_B + r.ori;
		result = shadeBall(intersectionPoint, r.dir);
	}
	fragColor = vec4(gamma2(result).rgb, 1.0);
}

void main() {
	mainImage(fragColor, fragCoord);
}