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

/* Noise functions, distinguished by variable types */ 

/* type: vec3 */
vec2 Noise(vec3 x)
{
    vec3 p = floor(x);
    vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);
	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z);

	vec4 rg = mix( 
		mix(hash42((uv + vec2(0.0,0.0))/256.), hash42((uv + vec2(1.0,0.0))/256.), f.x),
		mix(hash42((uv + vec2(0.0,1.0))/256.), hash42((uv + vec2(1.0,1.0))/256.), f.x),
		f.y);

	return mix( rg.yw, rg.xz, f.z );
}

/* type: vec2 */
vec4 Noise(vec2 x )
{
    vec2 p = floor(x.xy);
    vec2 f = fract(x.xy);
	f = f*f*(3.0-2.0*f);
	vec2 uv = p.xy + f.xy;
	return hash42((uv+0.5)/256.0);
}

/* Generates height map for waves in water surface */
float Waves( vec3 pos )
{
	const int octaves = 5;
	float sum = 0.0;

	// need to do the octaves from large to small, otherwise things don't line up
	// (because I rotate by 45 degrees on each octave)
	pos *= .1;
	pos += iTime*vec3(0,.1,.1);

	for ( int i=0; i < octaves; i++ )
	{
		//pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0);
		sum *= 1.25;
		sum += abs(Noise(pos).x-0.5)*(Noise(pos).y + 1.0);
		pos *= 1.75;
	}
	sum /= exp2(float(octaves));
	
	return 0.5-sum;
}

/* Like Waves, but uses more octaves to create more detailed pattern */
float WavesDetail( vec3 pos )
{
	const int octaves = 8;
	float sum = 0.0;

	// need to do the octaves from large to small, otherwise things don't line up
	// (because I rotate by 45 degrees on each octave)
	pos *= .2*vec3(1,1,1);
	pos += iTime*vec3(0,.1,.1);

	for ( int i=0; i < octaves; i++ )
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0);
		sum *= 1.775;
		sum += abs(Noise(pos).x-.5)*4.1875;
		pos *= 2.0;
	}
	sum /= exp2(float(octaves));
	
	return (0.5-sum)*0.5;
}

/* Like Waves, but uses sqrt to calculate height values */
float WavesSmooth( vec3 pos )
{
	const int octaves = 8;
	float sum = 0.0;

	// need to do the octaves from large to small, otherwise things don't line up
	// (because I rotate by 45 degrees on each octave)
	pos *= .2*vec3(1,1,1);
	pos += iTime*vec3(0,.1,.1);

	for ( int i=0; i < octaves; i++ )
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0);
		//// THIS IS IMPT FOR THE HEIGHT AND MOTION OF THE BALL (the first constant and the last constant in particular)
		sum += sqrt(pow(Noise(pos).x-.5,2.0)+.01)*1.85;
		pos *= 2.0;
	}
	sum /= exp2(float(octaves));
	
	return 0.5-sum;
}

/* */
float WaveCrests( vec3 ipos, in vec2 fragCoord )
{
	// number of octaves for Perlin noise
	const int octaves1 = 6;
	const int octaves2 = 20;
	float sum = 0.0;

	// first set of octaves
	vec3 pos = ipos * 0.1; //scale down the position vector
	pos += iTime*vec3(0,.1,.1);

	for (int i=0; i < octaves1; i++)
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0); // rotate by 45 degrees on each octave
		sum *= 2.0;
		sum += abs(Noise(pos*4.0).x - 0.5) * 2.0; // generate noise and accumulate
		pos *= 2.0; // scale position for next octave
	}

	// second set of octaves
	vec3 pos2 = pos;
	pos = pos2 * exp2(float(octaves1));
	pos.y = -.05*iTime;
	for ( int i=octaves1; i < octaves2; i++ )
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0); 
		sum *= 2.0;
		sum += pow(abs(Noise(pos*0.2).x - 0.5) * 5.0, 40.0);
		pos *= 2.0;
	}

	// normalize accumulated value?
	sum /= 1500.0;
	
	// adds noise to fragment coordinate for randomness
	sum -= Noise(ivec2(fragCoord.xy)).x * 0.01;
	
	return pow(smoothstep(.1,-.1,sum),6.0);
}

/* returns color of sky for a given direction */
vec3 ShadeSky(vec3 ray)
{
	return (texture(cubmapTexture, ray)).rgb;
}

vec3 ballRight = vec3(0,1,0);
vec3 ballUp = vec3(0,0,1);
vec3 ballForward = vec3(1,0,0);

// make ball bob up and down over time
void BallMovement( void )
{
	float period = 25;
	float amplitude = 0.08; 
	vec3 v = vec3(0,0,0);
	v.y = WavesSmooth(v);
	ballPosition = v + amplitude * sin(period*iTime);
}

/* Directional ball vector in local coordinate system to world space */
vec3 BallToWorld( vec3 dir )
{
	return dir.x*ballRight + dir.x*ballUp + dir.x*ballForward;
}

/* Directional world space vector to ball's local coordinate system */
vec3 WorldToBall( vec3 dir )
{
	return vec3( dot(dir,ballPosition), dot(dir,ballUp), dot(dir,ballForward) );
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
	pos = WorldToBall(pos); // transform pos vector from world to ball space
	
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
	specular += mix( vec3(0,.04,.04), ShadeSky(rr), smoothstep( -.1, .1, rr.y ) ); // add sky color to specular color
	
	// fresnel effect: amount of reflected light from a surface 
	// increases as the viewing angle approaches a grazing angle
	float ndotr = dot(norm,ray);
	float fresnel = pow(1.0-abs(ndotr),5.0);
	fresnel = mix( .001, 1.0, fresnel );

	col = mix( col, specular, fresnel);
	
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
	vec3 reflection = ShadeSky(reflectedRay);
	float t=TraceBall(pos, reflectedRay);
	
	if (t > 0.0)
	{
		reflection = ShadeBall( pos, reflectedRay );
	}

	// color of refraction + checks if intersecting with ball
	t=TraceBall(pos, refractedRay);
	
	vec3 col = vec3(0,.04,.04); // under-sea colour
	if ( t > 0.0 )
	{
		col = mix( col, ShadeBall(pos, refractedRay), exp(-t) );
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
	BallMovement();
	
	// vec2 camRot = vec2(.5,.5)+vec2(-.35,4.5)*(0.15);
	// vec3 pos;
	// vec3 ray;
	// CamPolar( pos, ray, vec3(0), camRot, 3.0, 1.0, fragCoord );

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
		//result = Sky( r.dir + vec3(1,1,0));
		result = ShadeSky( r.dir * vec3(0.2,1,0.08));
	
	// vignette effect
	
	// fragColor = vec4(result, 1,0);
	fragColor = vec4(gamma2(result),1);
}

void main() {
	mainImage(fragColor, fragCoord);
}