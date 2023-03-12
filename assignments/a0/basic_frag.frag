#version 330 core

uniform samplerCube cubmapTexture;

uniform vec2 iResolution;
uniform float iTime;
uniform int iFrame;
in vec2 fragCoord; 
out vec4 fragColor;

struct viewRay {
    vec3 ori;
    vec3 dir;
};

const vec3 camPosition = vec3(-2.226, 1.3, -1.536);
vec3 ballPosition;

// from assignment a5
vec3 gamma2(vec3 col) {
    return vec3(sqrt(col.r), sqrt(col.g), sqrt(col.b));
}

// sample hash function from shadertoy (https://www.shadertoy.com/view/4sKSzw)
vec4 hash42(vec2 p)
{   
    p -= floor(p / 289.0) * 289.0;
    p += vec2(223.35734, 550.56781);
    p *= p;
    
    float xy = p.x * p.y;
    
    return vec4(fract(xy * 0.00000012), fract(xy * 0.00000543), fract(xy * 0.00000192), fract(xy * 0.00000423));
}

viewRay getRay(in vec2 thetas, in vec2 fragCoord)
{
	//// cosines and sines of rotation angles...
    vec2 cosines = vec2(cos(thetas.x), cos(thetas.y));
	vec2 sines = vec2(sin(thetas.x), sin(thetas.y));
    
	//// create ray
    vec3 tempRay;
    tempRay.xy = fragCoord.xy - iResolution.xy*.5;
	tempRay.z = iResolution.y - 50;
	tempRay = normalize(tempRay);
    
	//// rotate ray by theta_x about x axis
   	tempRay.yz = vec2(tempRay.y*cosines.x, tempRay.z*cosines.x)+ vec2(-tempRay.z*sines.x, tempRay.y*sines.x);
	//// rotate ray by theta_y about y axis
	tempRay.xz = vec2(tempRay.x*cosines.y, tempRay.z*cosines.y)+ vec2(tempRay.z*sines.y, -tempRay.x*sines.y);
	
	return viewRay(camPosition, tempRay.xyz);
}

/* type: vec3 */
vec2 PerlinNoise(vec3 x)
{
    vec3 i = floor(x);
    vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);

	vec4 noise = mix( 
		mix(hash42((i.xy + vec2(0.0,0.0))), hash42((i.xy + vec2(1.0,0.0))), f.x),
		mix(hash42((i.xy + vec2(0.0,1.0))), hash42((i.xy + vec2(1.0,1.0))), f.x),
		f.y);

	return mix(noise.yw, noise.xz, f.z );
}

float noiseOctave(vec3 v, int octaves, float scale, float f1, float f2, int type, bool rotate) 
{
	float sum = 0.0;

	// move the noise around in xz plane over time
	v *= scale;
	v += 10*iTime*vec3(0,.1,.1);

	for (int i = 0; i < octaves; i++)
	{
		if (rotate)
		{
			// rotate the noise by 45 degrees
			v = (v.yzx + v.zyx*vec3(1,-1,1))/sqrt(2.0);
		}
		sum *= f1;

		if (type == 1) {
			sum += abs(PerlinNoise(v).x-0.5)*(PerlinNoise(v).y + 1.0);
		} 
		
		if (type == 2) {
			sum += abs(PerlinNoise(v).x-0.5)*4;
		}

		if (type == 3) {
			sum += sqrt(pow(PerlinNoise(v).x-.5,2.0)+.01)*1.85;
		}

		v *= f2;
	}
	sum /= exp2(float(octaves));
	// Your implementation ends here

	if (type == 3) {
		return 0.5-sum;
	}
	
	return 0.5*(0.5-sum);
}

float Waves( vec3 pos )
{
	return noiseOctave(pos, 5, 0.5, 1.25, 1.75, 1, false);
}

/* Like Waves, but uses more octaves to create more detailed pattern */
float WavesDetail( vec3 pos )
{
	return noiseOctave(pos, 8, 0.3, 1.75, 2.0, 2, true);
}

float WavesSmooth( vec3 pos )
{

	return noiseOctave(pos, 8, 0.2, 1.0, 2.0, 3, true);
}

/* returns color of sky for a given direction */
vec3 ShadeSky(vec3 ray)
{
	return (texture(cubmapTexture, vec3(ray.xy, -ray.z))).rgb;
}

vec3 ballRight = vec3(0,0,1);
vec3 ballUp = vec3(0,1,0);
vec3 ballForward = vec3(1,0,0);

// make ball bob up and down over time
void BallMovement( void )
{
	float period = 30;
	float amplitude = 0.08; 
	vec3 v = vec3(0,0,5);
	v.y = WavesSmooth(v)-0.15;
	v.z -= 2.5*iTime;
	ballPosition = v + amplitude * sin(period*iTime);
}

/* Makes ball */
float TraceBall( vec3 pos, vec3 ray )
{
	vec3 c = ballPosition;
	c -= pos;
	float r = 0.7; // ball radius
	float t = dot(c,ray); // distance between ray origin and intersect point of ray and ball?

	// distance between ball center and intersection point of the ray with the ball
	float p = length(c-t*ray);

	if ( p > r )
		return 0.0;

	// if intersection point inside ball
	return t-sqrt(r*r-p*p);
}

/* Shades/colors floating beachball pattern */
vec3 ShadeBall( vec3 pos, vec3 ray )
{
	pos -= ballPosition; // subtract ball position from position vector
	vec3 norm = normalize(pos); // gets surface normal
	
	vec3 lightDir = normalize(vec3(1,5,1)); 
	float ndotl = dot(norm,lightDir);
	
	// light value for given surface point - applies some light bleed to simulate subsurface scattering through plastic?
	vec3 light = smoothstep(-.1,1.0,ndotl)*vec3(1.0,.9,.8)+vec3(.06,.1,.1);

	// anti-alias factor for rendering?
	float aa = 4.0/iResolution.x;

	// kev
	
	vec3 col = vec3(1.0);
	float PI = 3.1415926535;

    float radius = sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z);
    float phi = atan(-pos.z, pos.x) + PI;

    float u = phi / (2.0 * PI); // longitude component

    // divide longitude into six sections
    float section = mod(floor((u * 6.0) + iTime * 5),6.);

    if (section == 1.0) {
        col = vec3(1.0, 0.0, 0.0); // red band
    }
    else if (section == 3.0) {
        col = vec3(0.0, 0.0, 1.0); // blue band
    }
    else if (section == 5.0) {
        col = vec3(0.0, 1.0, 0.0); // green band
    }
	col = col*light*2; // multiply color by surface lighting

	// kev
	
	// specular 
	vec3 h = normalize(lightDir-ray); // half vector between light and view directions
	float s = pow(max(0.0,dot(norm,h)),100.0)*10.0/32.0; // specular intensity
	vec3 specular = s*vec3(1,1,1); // white specular color

	vec3 rr = reflect(ray,norm); // reflection vector
	specular += mix( vec3(0,.7,.04), ShadeSky(rr), smoothstep( -.1, .1, rr.y ) ); // add sky color to specular color
	
	// fresnel effect: amount of reflected light from a surface 
	// increases as the viewing angle approaches a grazing angle
	float ndotr = dot(norm,ray);
	float fresnel = pow(1.0-abs(ndotr),5);

	col = mix( col, specular, fresnel);
	
	return col * 0.1;
}


/* Distance from input position to the ocean surface */
float OceanDistanceField( vec3 pos )
{
	return pos.y - Waves(pos);
}

/* Uses WavesDetail function to make ocean more realistic */
float OceanDistanceFieldDetail( vec3 pos )
{

	return pos.y - WavesDetail(pos);
}

/* Calculates normal vector of the ocean */
vec3 OceanNormal( vec3 pos )
{
	vec3 norm;
	vec2 d = vec2(.02*length(pos),0);
	
	norm.x = OceanDistanceFieldDetail( pos+d.xyy )-OceanDistanceFieldDetail( pos-d.xyy );
	norm.y = OceanDistanceFieldDetail( pos+d.yxy )-OceanDistanceFieldDetail( pos-d.yxy );
	norm.z = OceanDistanceFieldDetail( pos+d.yyx )-OceanDistanceFieldDetail( pos-d.yyx );

	
	return normalize(norm);
}

/* Ray marching algorithm that traces a ray through an ocean volume to 
determine the distance to the surface of the ocean */
float TraceOcean( vec3 pos, vec3 ray )
{
	float h = 1.0; // distance to ocean surface
	float t = 0.0; // distance traveled along the ray

	for ( int i=0; i < 100; i++ )
	{
		// exit loop if distance to surface is very small or we've traveled too far
		if ( h < .01 || t > 100.0 ) 
			break;

		h = OceanDistanceFieldDetail(pos + t*ray); //distance to ocean surface
		t += h; //increment total distance traveled
	}
	
	// return 0 if distance to surface too larget
	if ( h > .1 )
		return 0.0;
	
	return t;
}

/* Makes the color of a point on the ocean surface for a given viewing ray and screen coordinates */
vec3 ShadeOcean( vec3 pos, vec3 ray, in vec2 fragCoord )
{
	vec3 norm = OceanNormal(pos); //surface normal of given ocean point
	float ndotr = dot(ray,norm); 

	float fresnel = pow(1.0-abs(ndotr),5.0); //fresnel term for reflection
	
	// reflection and refraction rays based on surface normal and viewing ray
	vec3 reflectedRay = ray-2.0*norm*ndotr; 
	vec3 refractedRay = ray+(-cos(1.3*acos(-ndotr))-ndotr)*norm;	
	refractedRay = normalize(refractedRay);
	
	// color of reflection + checks if intersecting with ball
	vec3 reflection = ShadeSky(reflectedRay) * 4;
	float t=TraceBall(pos, reflectedRay);
	
	if (t > 0.0)
	{
		reflection = ShadeBall( pos, reflectedRay );
	}

	// color of refraction + checks if intersecting with ball
	t=TraceBall(pos, refractedRay);
	
	vec3 col = vec3(0,.06,.06); // under-sea colour
	if ( t > 0.0 )
	{
		col = mix( col, ShadeBall(pos, refractedRay), exp(-t) );
	}
	
	// mixes reflection and refraction colors based on fresnel term
	col = mix( col, reflection, fresnel );
	
	// adds foam to surface color - MAY NOT NEED
	
	return col;
}

/* The function called in the fragment shader */
void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
	BallMovement();

	vec2 rot_angles = vec2(0.3, 0.9668);
    viewRay r = getRay(rot_angles, fragCoord);
	
	float to = TraceOcean( r.ori, r.dir );
	float tb = TraceBall( r.ori, r.dir );
	
	vec3 result;
	if ( to > 0.0 && ( to < tb || tb == 0.0 ) )
		result = ShadeOcean( r.ori+r.dir*to, r.dir, fragCoord );
	else if ( tb > 0.0 )
		result = ShadeBall( r.ori+r.dir*tb, r.dir );
	else
		// changes angle at which we are looking at the sky
		result = ShadeSky( vec3(0.8,0,0) + r.dir * vec3(1,2.5,1));
		//result = ShadeSky( vec3(0,0,0) + r.dir);
	
	fragColor = vec4(gamma2(result),1);
}

void main() {
	mainImage(fragColor, fragCoord);
}