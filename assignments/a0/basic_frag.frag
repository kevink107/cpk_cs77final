#version 330 core

uniform samplerCube cubmapTexture;

uniform vec2 iResolution;
uniform float iTime;
uniform int iFrame;
in vec2 fragCoord; 
out vec4 fragColor;

// uniform sampler2D bufferTexture;

struct viewRay{
    vec3 ori;
    vec3 dir;
};

const float tau = 6.28318530717958647692;

// Gamma correction
// #define GAMMA (2.2)

vec3 ToLinear( in vec3 col )
{
	// simulate a monitor, converting colour values into light values
	return pow( col, vec3(2.2) );
}

vec3 gamma2(vec3 col) {
    return vec3(sqrt(col.r), sqrt(col.g), sqrt(col.b));
}

vec3 ToGamma( in vec3 col )
{
	// convert back into colour values, so the correct light will come out of the monitor
	return pow( col, vec3(1.0/2.2) );
}

vec4 hash42(vec2 p)
{
	// vec4 p4 = fract(vec4(p.xyxy) * vec4(.1031, .1030, .0973, .1099));
    // p4 += dot(p4, p4.wzxy+33.33);
    // return fract((p4.xxyz+p4.yzzw)*p4.zywx);
    
    p -= floor(p / 289.0) * 289.0;
    p += vec2(223.35734, 550.56781);
    p *= p;
    
    float xy = p.x * p.y;
    
    return vec4(fract(xy * 0.00000012),
                     fract(xy * 0.00000543),
                     fract(xy * 0.00000192),
                     fract(xy * 0.00000423));

}

vec3 localRay;


viewRay getRay(in vec2 thetas, in vec2 fragCoord)
{
	//// cosines and sines of rotation angles...
    vec2 cosines = vec2(cos(thetas.x), cos(thetas.y));
	vec2 sines = vec2(sin(thetas.x), sin(thetas.y));
    
	//// create ray
    vec3 tempRay;
    tempRay.xy = fragCoord.xy - iResolution.xy*.5;
	tempRay.z = iResolution.y;
	tempRay = normalize(tempRay);
	localRay = tempRay;
    
	//// rotate ray by theta_x about x axis
   tempRay.yz = vec2(tempRay.y*cosines.x+0.1, tempRay.z*cosines.x)+ vec2(-tempRay.z*sines.x, tempRay.y*sines.x);
	//// rotate ray by theta_y about y axis
	tempRay.xz = vec2(tempRay.x*cosines.y, tempRay.z*cosines.y)+ vec2(tempRay.z*sines.y, -tempRay.x*sines.y);
	
	return viewRay(vec3(-2.226, 1.3, -1.536), tempRay.xyz);
    // return viewRay(-3.0*vec3(cosines.x*sines.y, -sines.x, cosines.x*cosines.y), tempRay.xyz);
}

/* Noise functions, distinguished by variable types */ 
/* type: vec3 */
vec2 Noise(vec3 x)
{
    vec3 p = floor(x);
    vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);
	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z);
	vec4 rg = hash42((uv+f.xy+0.5)/256.0);
	return mix( rg.yw, rg.xz, f.z );
}

/* type: vec3 */
vec2 NoisePrecise(vec3 x)
{
    vec3 p = floor(x);
    vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);
	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z);

	vec4 rg = mix( mix(
				hash42((uv+0.5)/256.0),
				hash42((uv+vec2(1,0)+0.5)/256.0),
				f.x ),
				  mix(
				hash42((uv+vec2(0,1)+0.5)/256.0),
				hash42((uv+1.5)/256.0),
				f.x ),
				f.y );

	return mix( rg.yw, rg.xz, f.z );
}

/* type: vec2 */
vec4 Noise( in vec2 x )
{
    vec2 p = floor(x.xy);
    vec2 f = fract(x.xy);
	f = f*f*(3.0-2.0*f);
	vec2 uv = p.xy + f.xy;
	return hash42((uv+0.5)/256.0);
}

/* type: ivec2 */
vec4 Noise( in ivec2 x )
{
	return hash42((vec2(x)+0.5)/256.0);
}

/* type: ivec3 */
vec2 Noise( in ivec3 x )
{
	vec2 uv = vec2(x.xy)+vec2(37.0,17.0)*float(x.z);
	return hash42((uv+0.5)/256.0).xz;
}

/* Generates height map for waves in water surface */
float Waves( vec3 pos )
{
	pos *= .1*vec3(1,1,1);
	
	const int octaves = 5;
	float f = 0.0;

	// need to do the octaves from large to small, otherwise things don't line up
	// (because I rotate by 45 degrees on each octave)
	pos += iTime*vec3(0,.1,.1);
	for ( int i=0; i < octaves; i++ )
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0);
		f  = f*1.25+abs(Noise(pos).x-.5)*(Noise(pos).y + 1.0);
		pos *= 1.75;
	}
	f /= exp2(float(octaves));
	
	return (.5-f)*1.0;
}

/* Like Waves, but uses more octaves to create more detailed pattern */
float WavesDetail( vec3 pos )
{
	pos *= .2*vec3(1,1,1);
	
	const int octaves = 8;
	float f = 0.0;

	// need to do the octaves from large to small, otherwise things don't line up
	// (because I rotate by 45 degrees on each octave)
	pos += iTime*vec3(0,.1,.1);
	for ( int i=0; i < octaves; i++ )
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0);
		f  = f*1.775+abs(NoisePrecise(pos).x-.5)*4.1875;
		pos *= 2.0;
	}
	f /= exp2(float(octaves));
	
	return (.5-f)*0.5;
}

/* Like Waves, but uses sqrt to calculate height values */
float WavesSmooth( vec3 pos )
{
	pos *= .2*vec3(1,1,1);
	
	const int octaves = 8;
	float f = 0.0;

	// need to do the octaves from large to small, otherwise things don't line up
	// (because I rotate by 45 degrees on each octave)
	pos += iTime*vec3(0,.1,.1);
	for ( int i=0; i < octaves; i++ )
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0);
		//// THIS IS IMPT FOR THE HEIGHT AND MOTION OF THE BALL (the first constant and the last constant in particular)
		f  = f*1.0+sqrt(pow(NoisePrecise(pos).x-.5,2.0)+.01)*1.85;
		pos *= 2.0;
	}
	f /= exp2(float(octaves));
	
	return (.5-f)*1.0;
}

/* */
float WaveCrests( vec3 ipos, in vec2 fragCoord )
{
	vec3 pos = ipos * 0.1; //scale down the position vector
	
	// number of octaves for Perlin noise
	const int octaves1 = 6;
	const int octaves2 = 20;
	float f = 0.0;

	// first set of octaves
	pos += iTime*vec3(0,.1,.1);
	vec3 pos2 = pos;
	for (int i=0; i < octaves1; i++)
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0); // rotate by 45 degrees on each octave
		f = f*2.0+abs(Noise(pos*4.0).x - 0.5) * 2.0; // generate noise and accumulate
		pos *= 2.0; // scale position for next octave
	}

	// second set of octaves
	pos = pos2 * exp2(float(octaves1));
	pos.y = -.05*iTime;
	for ( int i=octaves1; i < octaves2; i++ )
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0); 
		f  = f*2.0+pow(abs(Noise(pos*0.2).x - 0.5) * 5.0, 40.0);
		pos *= 2.0;
	}

	// normalize accumulated value?
	f /= 1500.0;
	
	// adds noise to fragment coordinate for randomness
	f -= Noise(ivec2(fragCoord.xy)).x * 0.01;
	
	return pow(smoothstep(.1,-.1,f),6.0);
}

/* returns color of sky for a given direction */
vec3 Sky( vec3 ray )
{
	return (texture(cubmapTexture, ray)).rgb;
}

vec3 boatRight = vec3(0,1,0);
vec3 boatUp = vec3(0,0,1);
vec3 boatForward = vec3(1,0,0);
vec3 boatPosition;

vec2 boatNoise(vec2 v) {
	vec2 rand = vec2(0,0);
	rand  = 50.0 * 1.05 * fract(v * 0.3183099 + vec2(0.71, 0.113));
    rand = -1.0 + 2 * 1.05 * fract(rand.x * rand.y * (rand.x + rand.y) * rand);
	return rand;
}

/* Uses transformation matrix to transform and orient the ball in the scene */
void ComputeBoatTransform( void )
{
	float period = 25;
	float amplitude = 0.08; 
	vec3 v = vec3(0,0,0);
	v.y = WavesSmooth(v);
	boatPosition = v + amplitude * sin(period*iTime);
}

/* Directional boat vector in local coordinate system to world space */
vec3 BoatToWorld( vec3 dir )
{
	return dir.x*boatRight + dir.x*boatUp + dir.x*boatForward;
}

/* Directional world space vector to boat's local coordinate system */
vec3 WorldToBoat( vec3 dir )
{
	return vec3( dot(dir,boatPosition), dot(dir,boatUp), dot(dir,boatForward) );
}

/* Makes ball */
float TraceBoat( vec3 pos, vec3 ray )
{
	vec3 c = boatPosition;
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
vec3 ShadeBoat( vec3 pos, vec3 ray )
{
	pos -= boatPosition; // subtract boat position from position vector
	vec3 norm = normalize(pos); // gets surface normal
	pos = WorldToBoat(pos); // transform pos vector from world to boat space
	
	vec3 lightDir = normalize(vec3(-2,3,1)); 
	float ndotl = dot(norm,lightDir);
	
	// light value for given surface point - applies some light bleed to simulate subsurface scattering through plastic?
	vec3 light = smoothstep(-.1,1.0,ndotl)*vec3(1.0,.9,.8)+vec3(.06,.1,.1);

	// anti-alias factor for rendering?
	float aa = 4.0/iResolution.x;
	
	vec3 col = vec3(1.0);
	float PI = 3.1415926535;

    float radius = sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z);
    float phi = atan(-pos.z, pos.x) + PI;

    float u = phi / (2.0 * PI); // longitude component
    float v = 0.5 + (asin(-pos.y / radius) / PI); // latitude component

    // divide longitude into six sections
    float section = floor(u * 6.0);

    if (section == 0.0 || section == 2.0 || section == 4.0) {
        col = vec3(1.0); // alternating white bands
    }
    else if (section == 1.0) {
        col = vec3(1.0, 0.0, 0.0); // red band
    }
    else if (section == 3.0) {
        col = vec3(0.0, 0.0, 1.0); // blue band
    }
    else if (section == 5.0) {
        col = vec3(0.0, 1.0, 0.0); // green band
    }
	col = col*light; // multiply color by surface lighting
	
	// specular 
	vec3 h = normalize(lightDir-ray); // half vector between light and view directions
	float s = pow(max(0.0,dot(norm,h)),100.0)*100.0/32.0; // specular intensity
	vec3 specular = s*vec3(1,1,1); // white specular color

	vec3 rr = reflect(ray,norm); // reflection vector
	specular += mix( vec3(0,.04,.04), Sky(rr), smoothstep( -.1, .1, rr.y ) ); // add sky color to specular color
	
	// fresnel effect: amount of reflected light from a surface 
	// increases as the viewing angle approaches a grazing angle
	float ndotr = dot(norm,ray);
	float fresnel = pow(1.0-abs(ndotr),5.0);
	fresnel = mix( .001, 1.0, fresnel );

	col = mix( col, specular, fresnel );
	
	return col;
}


const int i = 0;
/* Distance from input position to the ocean surface */
float OceanDistanceField( vec3 pos )
{
	int n= i%3;
	n+=1;
	return pos.y - n*1.2*Waves(pos);
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
	vec2 d = vec2(.01*length(pos),0);
	
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

		h = OceanDistanceField(pos + t*ray); //distance to ocean surface
		t += h; //increment total distance traveled
	}
	
	// return 0 if distance to surface too large
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
	vec3 refractedRay = ray+(-cos(1.33*acos(-ndotr))-ndotr)*norm;	
	refractedRay = normalize(refractedRay);
	
	// color of reflection + checks if intersecting with ball
	vec3 reflection = Sky(reflectedRay);
	float t=TraceBoat(pos, reflectedRay);
	
	if (t > 0.0)
	{
		reflection = ShadeBoat( pos, reflectedRay );
	}

	// color of refraction + checks if intersecting with ball
	t=TraceBoat(pos, refractedRay);
	
	vec3 col = vec3(0,.04,.04); // under-sea colour
	if ( t > 0.0 )
	{
		col = mix( col, ShadeBoat(pos, refractedRay), exp(-t) );
	}
	
	// mixes reflection and refraction colors based on fresnel term
	col = mix( col, reflection, fresnel );
	
	// adds foam to surface color - MAY NOT NEED
	col = mix( col, vec3(1), WaveCrests(pos,fragCoord) );
	
	return col;
}

/* The function called in the fragment shader */
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	ComputeBoatTransform();
	
	// vec2 camRot = vec2(.5,.5)+vec2(-.35,4.5)*(0.15);
	// vec3 pos;
	// vec3 ray;
	// CamPolar( pos, ray, vec3(0), camRot, 3.0, 1.0, fragCoord );

	vec2 rot_angles = vec2(0.3975, 0.9668);
    viewRay r = getRay(rot_angles, fragCoord);
	
	float to = TraceOcean( r.ori, r.dir );
	float tb = TraceBoat( r.ori, r.dir );
	
	vec3 result;
	if ( to > 0.0 && ( to < tb || tb == 0.0 ) )
		result = ShadeOcean( r.ori+r.dir*to, r.dir, fragCoord );
	else if ( tb > 0.0 )
		result = ShadeBoat( r.ori+r.dir*tb, r.dir );
	else
		// changes angle at which we are looking at the sky
		//result = Sky( r.dir + vec3(1,1,0));
		result = Sky( r.dir * vec3(0.2,1,0.08));
	
	// vignette effect
	result *= 1.0*smoothstep( .25, 1.0, localRay.z );
	
	// fragColor = vec4(result, 1,0);
	fragColor = vec4(ToGamma(result),1);
    // fragColor = vec4(gamma2(result), 1.);
}

void main() {
	mainImage(fragColor, fragCoord);
}


