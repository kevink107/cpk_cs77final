#version 330 core

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

// Set up a camera looking at the scene.
// origin - camera is positioned relative to, and looking at, this point
// distance - how far camera is from origin
// rotation - about x & y axes, by left-hand screw rule, relative to camera looking along +z
// zoom - the relative length of the lens
// void CamPolar( out vec3 pos, out vec3 ray, in vec3 origin, in vec2 rotation, in float distance, in float zoom, in vec2 fragCoord )
// {
// 	// get rotation coefficients
// 	vec2 c = vec2(cos(rotation.x),cos(rotation.y));
// 	vec4 s;
// 	s.xy = vec2(sin(rotation.x),sin(rotation.y)); // worth testing if this is faster as sin or sqrt(1.0-cos);
// 	s.zw = -s.xy;

// 	// ray in view space
// 	ray.xy = fragCoord.xy - iResolution.xy*.5;
// 	ray.z = iResolution.y*zoom;
// 	ray = normalize(ray);
// 	localRay = ray;
	
// 	// rotate ray
// 	ray.yz = ray.yz*c.xx + ray.zy*s.zx;
// 	ray.xz = ray.xz*c.yy + ray.zx*s.yw;
	
// 	// position camera
// 	pos = origin - distance*vec3(c.x*s.y,s.z,c.x*c.y);
// }

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
    tempRay.yz = vec2(tempRay.y*cosines.x, tempRay.z*cosines.x)+ vec2(-tempRay.z*sines.x, tempRay.y*sines.x);
	//// rotate ray by theta_y about y axis
	tempRay.xz = vec2(tempRay.x*cosines.y, tempRay.z*cosines.y)+ vec2(tempRay.z*sines.y, -tempRay.x*sines.y);
	
	return viewRay(vec3(-2.226, 1.3, -1.536), tempRay.xyz);
    // return viewRay(-3.0*vec3(cosines.x*sines.y, -sines.x, cosines.x*cosines.y), tempRay.xyz);
}

// Noise functions, distinguished by variable types

vec2 Noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);
//	vec3 f2 = f*f; f = f*f2*(10.0-15.0*f+6.0*f2);

	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z);

	// vec4 rg = textureLod( iChannel0, (uv+f.xy+0.5)/256.0, 0.0 );
	vec4 rg = hash42((uv+f.xy+0.5)/256.0);

	return mix( rg.yw, rg.xz, f.z );
}

vec2 NoisePrecise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);
//	vec3 f2 = f*f; f = f*f2*(10.0-15.0*f+6.0*f2);

	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z);

	// vec4 rg = mix( mix(
	// 			textureLod( iChannel0, (uv+0.5)/256.0, 0.0 ),
	// 			textureLod( iChannel0, (uv+vec2(1,0)+0.5)/256.0, 0.0 ),
	// 			f.x ),
	// 			  mix(
	// 			textureLod( iChannel0, (uv+vec2(0,1)+0.5)/256.0, 0.0 ),
	// 			textureLod( iChannel0, (uv+1.5)/256.0, 0.0 ),
	// 			f.x ),
	// 			f.y );
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

vec4 Noise( in vec2 x )
{
    vec2 p = floor(x.xy);
    vec2 f = fract(x.xy);
	f = f*f*(3.0-2.0*f);
//	vec3 f2 = f*f; f = f*f2*(10.0-15.0*f+6.0*f2);

	vec2 uv = p.xy + f.xy;
	return hash42((uv+0.5)/256.0);

	// return textureLod( iChannel0, (uv+0.5)/256.0, 0.0 );
}

vec4 Noise( in ivec2 x )
{
	return hash42((vec2(x)+0.5)/256.0);
	// return textureLod( iChannel0, (vec2(x)+0.5)/256.0, 0.0 );
}

vec2 Noise( in ivec3 x )
{
	vec2 uv = vec2(x.xy)+vec2(37.0,17.0)*float(x.z);
	return hash42((uv+0.5)/256.0).xz;
	// return textureLod( iChannel0, (uv+0.5)/256.0, 0.0 ).xz;
}


float Waves( vec3 pos )
{
	pos *= .2*vec3(1,1,1);
	
	const int octaves = 5;
	float f = 0.0;

	// need to do the octaves from large to small, otherwise things don't line up
	// (because I rotate by 45 degrees on each octave)
	pos += iTime*vec3(0,.1,.1);
	for ( int i=0; i < octaves; i++ )
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0);
		f  = f*2.0+abs(Noise(pos).x-.5)*2.0;
		pos *= 2.0;
	}
	f /= exp2(float(octaves));
	
	return (.5-f)*1.0;
}

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
		f  = f*2.0+abs(NoisePrecise(pos).x-.5)*2.0;
		pos *= 2.0;
	}
	f /= exp2(float(octaves));
	
	return (.5-f)*1.0;
}

float WavesSmooth( vec3 pos )
{
	pos *= .2*vec3(1,1,1);
	
	const int octaves = 2;
	float f = 0.0;

	// need to do the octaves from large to small, otherwise things don't line up
	// (because I rotate by 45 degrees on each octave)
	pos += iTime*vec3(0,.1,.1);
	for ( int i=0; i < octaves; i++ )
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0);
		//f  = f*2.0+abs(Noise(pos).x-.5)*2.0;
		f  = f*2.0+sqrt(pow(NoisePrecise(pos).x-.5,2.0)+.01)*2.0;
		pos *= 2.0;
	}
	f /= exp2(float(octaves));
	
	return (.5-f)*1.0;
}

float WaveCrests( vec3 ipos, in vec2 fragCoord )
{
	vec3 pos = ipos;
	pos *= .2*vec3(1,1,1);
	
	const int octaves1 = 6;
	const int octaves2 = 16;
	float f = 0.0;

	// need to do the octaves from large to small, otherwise things don't line up
	// (because I rotate by 45 degrees on each octave)
	pos += iTime*vec3(0,.1,.1);
	vec3 pos2 = pos;
	for ( int i=0; i < octaves1; i++ )
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0);
		f  = f*1.5+abs(Noise(pos).x-.5)*2.0;
		pos *= 2.0;
	}
	pos = pos2 * exp2(float(octaves1));
	pos.y = -.05*iTime;
	for ( int i=octaves1; i < octaves2; i++ )
	{
		pos = (pos.yzx + pos.zyx*vec3(1,-1,1))/sqrt(2.0);
		f  = f*1.5+pow(abs(Noise(pos).x-.5)*2.0,1.0);
		pos *= 2.0;
	}
	f /= 1500.0;
	
	f -= Noise(ivec2(fragCoord.xy)).x*.01;
	
	return pow(smoothstep(.4,-.1,f),6.0);
}


vec3 Sky( vec3 ray )
{
	return vec3(.4,.45,.5);
}


vec3 boatRight;
vec3 boatUp;
vec3 boatForward;
vec3 boatPosition;

void ComputeBoatTransform( void )
{
	vec3 samples[5];
	
	samples[0] = vec3(0,0, 0);
	samples[1] = vec3(0,0, .5);
	samples[2] = vec3(0,0,-.5);
	samples[3] = vec3( .5,0,0);
	samples[4] = vec3(-.5,0,0);
	
	samples[0].y = WavesSmooth(samples[0]);
	samples[1].y = WavesSmooth(samples[1]);
	samples[2].y = WavesSmooth(samples[2]);
	samples[3].y = WavesSmooth(samples[3]);
	samples[4].y = WavesSmooth(samples[4]);

	boatPosition = (samples[0]+samples[1]+samples[2]+samples[3]+samples[4])/5.0;
	
	boatRight = samples[3]-samples[4];
	boatForward = samples[1]-samples[2];
	boatUp = normalize(cross(boatForward,boatRight));
	boatRight = normalize(cross(boatUp,boatForward));
	boatForward = normalize(boatForward);
	
	boatPosition += .0*boatUp;
}

vec3 BoatToWorld( vec3 dir )
{
	return dir.x*boatRight+dir.x*boatUp+dir.x*boatForward;
}

vec3 WorldToBoat( vec3 dir )
{
	return vec3( dot(dir,boatRight), dot(dir,boatUp), dot(dir,boatForward) );
}

float TraceBoat( vec3 pos, vec3 ray )
{
	vec3 c = boatPosition;
	float r = 1.0;
	
	c -= pos;
	
	float t = dot(c,ray);
	
	float p = length(c-t*ray);
	if ( p > r )
		return 0.0;
	
	return t-sqrt(r*r-p*p);
}


vec3 ShadeBoat( vec3 pos, vec3 ray )
{
	pos -= boatPosition;
	vec3 norm = normalize(pos);
	pos = WorldToBoat(pos);
	
	vec3 lightDir = normalize(vec3(-2,3,1));
	float ndotl = dot(norm,lightDir);
	
	// allow some light bleed, as if it's subsurface scattering through plastic
	vec3 light = smoothstep(-.1,1.0,ndotl)*vec3(1.0,.9,.8)+vec3(.06,.1,.1);

	// anti-alias the albedo
	float aa = 4.0/iResolution.x;
	
	//vec3 albedo = ((fract(pos.x)-.5)*(fract(pos.y)-.5)*(fract(pos.z)-.5) < 0.0) ? vec3(0) : vec3(1);
	// vec3 albedo = vec3(1,.01,0);
	// albedo = mix( vec3(.04), albedo, smoothstep( .25-aa, .25, abs(pos.y) ) );
	// albedo = mix( mix( vec3(1), vec3(.04), smoothstep(-aa*4.0,aa*4.0,cos(atan(pos.x,pos.z)*6.0)) ), albedo, smoothstep( .2-aa*1.5, .2, abs(pos.y) ) );
	// albedo = mix( vec3(.04), albedo, smoothstep( .05-aa*1.0, .05, abs(abs(pos.y)-.6) ) );
	// albedo = mix( vec3(1,.8,.08), albedo, smoothstep( .05-aa*1.0, .05, abs(abs(pos.y)-.65) ) );

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
	col = col*light;
	
	// specular
	vec3 h = normalize(lightDir-ray);
	float s = pow(max(0.0,dot(norm,h)),100.0)*100.0/32.0;
	
	vec3 specular = s*vec3(1,1,1);

	vec3 rr = reflect(ray,norm);
	specular += mix( vec3(0,.04,.04), Sky(rr), smoothstep( -.1, .1, rr.y ) );
	
	float ndotr = dot(norm,ray);
	float fresnel = pow(1.0-abs(ndotr),5.0);
	fresnel = mix( .001, 1.0, fresnel );

	col = mix( col, specular, fresnel );
	
	return col;
}


float OceanDistanceField( vec3 pos )
{
	return pos.y - Waves(pos);
}

float OceanDistanceFieldDetail( vec3 pos )
{
	return pos.y - WavesDetail(pos);
}

vec3 OceanNormal( vec3 pos )
{
	vec3 norm;
	vec2 d = vec2(.01*length(pos),0);
	
	norm.x = OceanDistanceFieldDetail( pos+d.xyy )-OceanDistanceFieldDetail( pos-d.xyy );
	norm.y = OceanDistanceFieldDetail( pos+d.yxy )-OceanDistanceFieldDetail( pos-d.yxy );
	norm.z = OceanDistanceFieldDetail( pos+d.yyx )-OceanDistanceFieldDetail( pos-d.yyx );

	return normalize(norm);
}

float TraceOcean( vec3 pos, vec3 ray )
{
	float h = 1.0;
	float t = 0.0;
	for ( int i=0; i < 100; i++ )
	{
		if ( h < .01 || t > 100.0 )
			break;
		h = OceanDistanceField( pos+t*ray );
		t += h;
	}
	
	if ( h > .1 )
		return 0.0;
	
	return t;
}


vec3 ShadeOcean( vec3 pos, vec3 ray, in vec2 fragCoord )
{
	vec3 norm = OceanNormal(pos);
	float ndotr = dot(ray,norm);

	float fresnel = pow(1.0-abs(ndotr),5.0);
	
	vec3 reflectedRay = ray-2.0*norm*ndotr;
	vec3 refractedRay = ray+(-cos(1.33*acos(-ndotr))-ndotr)*norm;	
	refractedRay = normalize(refractedRay);

	const float crackFudge = .0;
	
	// reflection
	vec3 reflection = Sky(reflectedRay);
	float t=TraceBoat( pos-crackFudge*reflectedRay, reflectedRay );
	
	if ( t > 0.0 )
	{
		reflection = ShadeBoat( pos+(t-crackFudge)*reflectedRay, reflectedRay );
	}

	
	// refraction
	t=TraceBoat( pos-crackFudge*refractedRay, refractedRay );
	
	vec3 col = vec3(0,.04,.04); // under-sea colour
	if ( t > 0.0 )
	{
		col = mix( col, ShadeBoat( pos+(t-crackFudge)*refractedRay, refractedRay ), exp(-t) );
	}
	
	col = mix( col, reflection, fresnel );
	
	// foam
	col = mix( col, vec3(1), WaveCrests(pos,fragCoord) );
	
	return col;
}

// The function called in the fragment shader
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	ComputeBoatTransform();
	
	// vec2 camRot = vec2(.5,.5)+vec2(-.35,4.5)*(0.15);
	// vec3 pos;
	// vec3 ray;
	// CamPolar( pos, ray, vec3(0), camRot, 3.0, 1.0, fragCoord );

	vec2 rot_angles = vec2(0.4475, 0.9668);
    viewRay r = getRay(rot_angles, fragCoord);
	
	float to = TraceOcean( r.ori, r.dir );
	float tb = TraceBoat( r.ori, r.dir );
	
	vec3 result;
	if ( to > 0.0 && ( to < tb || tb == 0.0 ) )
		result = ShadeOcean( r.ori+r.dir*to, r.dir, fragCoord );
	else if ( tb > 0.0 )
		result = ShadeBoat( r.ori+r.dir*tb, r.dir );
	else
		result = Sky( r.dir );
	
	// vignette effect
	result *= 1.1*smoothstep( .35, 1.0, localRay.z );
	
	// fragColor = vec4(result, 1,0);
	fragColor = vec4(ToGamma(result),1.0);
    // fragColor = vec4(gamma2(result), 1.);
}

void main() {
	mainImage(fragColor, fragCoord);
}


