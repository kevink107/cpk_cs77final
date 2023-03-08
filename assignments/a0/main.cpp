//#####################################################################
// Main
// Dartmouth COSC 77/177 Computer Graphics, starter code
// Contact: Bo Zhu (bo.zhu@dartmouth.edu)
//#####################################################################
#include <algorithm>
#include <cstdio>
#include <iostream>
#include <random>
#include "Common.h"
#include "Driver.h"
#include "Particles.h"
#include "OpenGLMesh.h"
#include "OpenGLCommon.h"
#include "OpenGLWindow.h"
#include "OpenGLViewer.h"
#include "OpenGLMarkerObjects.h"
#include "OpenGLParticles.h"

/////////////////////////////////////////////////////////////////////
//// TODO: put your name in the string               
/////////////////////////////////////////////////////////////////////

const std::string author="Logan Chang";

/////////////////////////////////////////////////////////////////////
//// These are helper functions we created to generate circles and triangles by testing whether a point is inside the shape or not.
//// They can be used in the paintGrid function as "if the pixel is inside, draw some color; else skip."
//// You may create your own functions to draw your own shapes

//// The paintGrid function is implemented as a GLSL fragment shader. 
//// The GLSL grammar is C-style, and if you are curious about its full picture (which we will start to learn the details in Week 3), 
//// you may find more information on https://www.khronos.org/files/opengl43-quick-reference-card.pdf (Page 6 - 7 would probably be helpful!)
//// You don't need advanced GLSL features for this assignment (reading the starter code should be enough).
//// You can also test it (copy the whole string) in Shadertoy: https://www.shadertoy.com/new    
/////////////////////////////////////////////////////////////////////

const std::string draw_pixels = To_String(
const float M_PI = 3.1415926535; 

// The side length of the minimum unit (or the new "pixels")
const float PIXEL_SIZE = 10.; 

// To check if a point is inside a circle
bool inCircle(vec2 p, vec2 center, float radius) {
	vec2 to_center = p - center;
	if (dot(to_center, to_center) < radius * radius) {
		return true;
	}
	return false;
}

// To check if a point is inside a triangle
bool inTriangle(vec2 p, vec2 p1, vec2 p2, vec2 p3) {
	if (dot(cross(vec3(p2 - p1, 0), vec3(p - p1, 0)), cross(vec3(p2 - p1, 0), vec3(p3 - p1, 0))) >= 0. &&
		dot(cross(vec3(p3 - p2, 0), vec3(p - p2, 0)), cross(vec3(p3 - p2, 0), vec3(p1 - p2, 0))) >= 0. &&
		dot(cross(vec3(p1 - p3, 0), vec3(p - p3, 0)), cross(vec3(p1 - p3, 0), vec3(p2 - p3, 0))) >= 0.) {
		return true;
	}
	return false;
}

// To check if a point is inside an ellipse
bool inEllipse(vec2 p, vec2 center, float radiusX, float radiusY){
	return (pow(p.x - center.x, 2) / pow(radiusX, 2)) + (pow(p.y - center.y, 2) / pow(radiusY, 2)) <= 1.0;
}

// To check if a point is inside a rectangle
bool inRectangle(vec2 p, float x1, float x2, float y1, float y2){
	return (p[0] >= min(x1, x2) && p[1] >= min(y1, y2) && p[0] <= max(x1, x2) && p[1] <= max(y1, y2));
}

// To convert from Polar Coordinates to Cartesian coordinates
vec2 polar2cart(float angle, float length) {
	return vec2(cos(angle) * length, sin(angle) * length);
}

// Provides the positive y-coordinate of a point on an ellipse (centered at the origin) given an x-coordinate as if the ellipse is centered about the origin
float yOnEllipse(float x, float radiusX, float radiusY){
	return radiusY * sqrt((1 - (pow(x, 2) / pow(radiusX, 2))));
}

// Provides the positive x-coordinate of a point on an ellipse (centered at the origin) given a y-coordinate as if the ellipse is centered about the origin
float xOnEllipse(float y, float radiusX, float radiusY){
	return radiusX * sqrt((1 - (pow(y, 2) / pow(radiusY, 2))));
}

/////////////////////////////////////////////////////////////////////////
// Feel free to add more functions if needed!                          
/////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
// TODO: replace the code below with your own code                 //
// Useful variables:											   //
// iTime: the passed seconds from the start of the program         //
// iResolution: the size of the window (default: 1280*960)         //
/////////////////////////////////////////////////////////////////////

// Return the rgba color of the grid at position (x, y) 
vec4 paintGrid(float x, float y) {
	vec2 center = vec2(iResolution / PIXEL_SIZE / 2.); // window center
	vec2 quarter = vec2(iResolution / PIXEL_SIZE / 4.);
	vec2 fifth = vec2(iResolution / PIXEL_SIZE / 5.);
	vec2 seventh = vec2(iResolution / PIXEL_SIZE / 7.);

	// tennis ball
	float ballRadius = 5.0;
	float innerSeamRadius = 4.0;
	float outterSeamRadius = 3.0;
	float step = 10.0;

	vec2 ballCenter = quarter + vec2(0., sin(10.0 * iTime) * step); 
	vec2 ballLEdge = vec2(ballCenter.x- ballRadius, ballCenter.y);
	vec2 ballREdge = vec2(ballCenter.x + ballRadius, ballCenter.y);
	bool inBall = inCircle(vec2(x,y), ballCenter, ballRadius);

	bool inLInSeam = inCircle(vec2(x,y), ballLEdge, innerSeamRadius);
	bool inLOutSeam = inCircle(vec2(x,y), ballLEdge, outterSeamRadius);
	bool inRInSeam = inCircle(vec2(x,y), ballREdge, innerSeamRadius);
	bool inROutSeam = inCircle(vec2(x,y), ballREdge, outterSeamRadius);

	// racket head
	float outerRadiusX = quarter.y - 5;
	float outerRadiusY = quarter.y - 1;
	float innerRadiusX = outerRadiusX - 2.0;
	float innerRadiusY = outerRadiusY - 2.0;

	vec2 headCenter = center + vec2(0, fifth.y);

	bool inOuterFrame = inEllipse(vec2(x,y), headCenter, outerRadiusX, outerRadiusY);
	bool inInnerFrame = inEllipse(vec2(x,y), headCenter, innerRadiusX, innerRadiusY);

	// vertical racket strings
	float mainStringDist = 4.0;
	float mainStringWidth = 0.0;

	float yMainString1 = yOnEllipse(-2 * mainStringDist, outerRadiusX, outerRadiusY);
	float yMainString2 = yOnEllipse(-1 * mainStringDist, outerRadiusX, outerRadiusY);
	float yMainString3 = yOnEllipse(0 * mainStringDist, outerRadiusX, outerRadiusY);
	float yMainString4 = yOnEllipse(1 * mainStringDist, outerRadiusX, outerRadiusY);
	float yMainString5 = yOnEllipse(2 * mainStringDist, outerRadiusX, outerRadiusY);

	bool inMainString1 = inRectangle(vec2(x,y), headCenter.x + (-2 * mainStringDist), headCenter.x + (-2 * mainStringDist) + mainStringWidth, headCenter.y + yMainString1 - 1.0, headCenter.y - yMainString1 + 1.0); 
	bool inMainString2 = inRectangle(vec2(x,y), headCenter.x + (-1 * mainStringDist), headCenter.x + (-1 * mainStringDist) + mainStringWidth, headCenter.y + yMainString2 - 1.0, headCenter.y - yMainString2 + 1.0); 
	bool inMainString3 = inRectangle(vec2(x,y), headCenter.x + (0 * mainStringDist), headCenter.x + (0 * mainStringDist) + mainStringWidth, headCenter.y + yMainString3 -1.0, headCenter.y - yMainString3 + 1.0); 
	bool inMainString4 = inRectangle(vec2(x,y), headCenter.x + (1 * mainStringDist), headCenter.x + (1 * mainStringDist) + mainStringWidth, headCenter.y + yMainString4 - 1.0, headCenter.y - yMainString4 + 1.0); 
	bool inMainString5 = inRectangle(vec2(x,y), headCenter.x + (2 * mainStringDist), headCenter.x + (2 * mainStringDist) + mainStringWidth, headCenter.y + yMainString5 - 1.0, headCenter.y - yMainString5 + 1.0); 

	// horizontal racket strings
	float crossStringDist = 5.0;
	float crossStringWidth = 1.0;

	float xCrossString1 = xOnEllipse(-3 * crossStringDist, outerRadiusX, outerRadiusY);
	float xCrossString2 = xOnEllipse(-2 * crossStringDist, outerRadiusX, outerRadiusY);
	float xCrossString3 = xOnEllipse(-1 * crossStringDist, outerRadiusX, outerRadiusY);
	float xCrossString4 = xOnEllipse(0 * crossStringDist, outerRadiusX, outerRadiusY);
	float xCrossString5 = xOnEllipse(1 * crossStringDist, outerRadiusX, outerRadiusY);
	float xCrossString6 = xOnEllipse(2 * crossStringDist, outerRadiusX, outerRadiusY);
	float xCrossString7 = xOnEllipse(3 * crossStringDist, outerRadiusX, outerRadiusY); 

	bool inCrossString1 = inRectangle(vec2(x,y), headCenter.x - xCrossString1 + 1.0, headCenter.x + xCrossString1 - 1.0, headCenter.y + (-3 * crossStringDist), headCenter.y + (-3 * crossStringDist) + crossStringWidth);
	bool inCrossString2 = inRectangle(vec2(x,y), headCenter.x - xCrossString2 + 1.0, headCenter.x + xCrossString2 - 1.0, headCenter.y + (-2 * crossStringDist), headCenter.y +  (-2 * crossStringDist) + crossStringWidth);
	bool inCrossString3 = inRectangle(vec2(x,y), headCenter.x - xCrossString3 + 1.0, headCenter.x + xCrossString3 - 1.0, headCenter.y + (-1 * crossStringDist), headCenter.y +  (-1 * crossStringDist) + crossStringWidth);
	bool inCrossString4 = inRectangle(vec2(x,y), headCenter.x - xCrossString4 + 1.0, headCenter.x + xCrossString4 - 1.0, headCenter.y + (0 * crossStringDist) , headCenter.y + (0 * crossStringDist) + crossStringWidth);
	bool inCrossString5 = inRectangle(vec2(x,y), headCenter.x - xCrossString5 + 1.0, headCenter.x + xCrossString5 - 1.0, headCenter.y + (1 * crossStringDist) , headCenter.y + (1 * crossStringDist) + crossStringWidth);
	bool inCrossString6 = inRectangle(vec2(x,y), headCenter.x - xCrossString6 + 1.0, headCenter.x + xCrossString6 - 1.0, headCenter.y + (2 * crossStringDist) , headCenter.y + (2 * crossStringDist) + crossStringWidth);
	bool inCrossString7 = inRectangle(vec2(x,y), headCenter.x - xCrossString7 + 1.0, headCenter.x + xCrossString7 - 1.0, headCenter.y + (3 * crossStringDist) , headCenter.y + (3 * crossStringDist) + crossStringWidth);


	// racket throat
	vec2 p1 = vec2(headCenter.x - xCrossString1 + 1.0, headCenter.y + (-3 * crossStringDist));
	vec2 p2 = vec2(headCenter.x + xCrossString1 - 1.0, headCenter.y + (-3 * crossStringDist));
	vec2 p3 = vec2(headCenter.x, headCenter.y - outerRadiusY - seventh.y);

	vec2 innerP1 = p1 + vec2(2.0, 0.0);
	vec2 innerP2 = p2 + vec2(-2.0, 0.0);
	vec2 innerP3 = p3 + vec2(0.0, 5.0);

	bool inOuterThroat = inTriangle(vec2(x,y), p1, p2, p3);
	bool inInnerThroat = inTriangle(vec2(x,y), innerP1, innerP2, innerP3);

	// racket handle
	bool inHandle = inRectangle(vec2(x, y), innerP3.x - 1.75, innerP3.x + 1.75, innerP3.y, p3.y - innerRadiusY);
	

	// shading rules
	if ((inBall && inLInSeam && !inLOutSeam) || (inBall && inRInSeam && !inROutSeam)) {
		return vec4(vec3(255, 255, 255) / 255., 1.); // white
	} else if (inBall){
		return vec4(vec3(2, 249, 2) / 255., 1.); // tennis ball green
	} else if ((inOuterFrame && !inInnerFrame) || (inOuterThroat && !inInnerFrame && !inInnerThroat)){
		if (y >= headCenter.y + (2 * crossStringDist)){
			return vec4(vec3(51, 247, 2) / 255., 1.); // lime green
		} else if(y < headCenter.y + (2 * crossStringDist) && y >= headCenter.y + (-2 * crossStringDist)) {
			return vec4(vec3(157, 163, 155) / 255., 1.); // gray
		} else {
			return vec4(vec3(1, 1, 1) / 255., 1.); // black
		}
	} else if(inHandle){
		return vec4(vec3(1, 1, 1) / 255., 1.); 
	} else if (inMainString1 || inMainString2 || inMainString3 || inMainString4 || inMainString5){
		return vec4(vec3(255, 1, 1) / 255., 1.); // red
	} else if (inCrossString1 || inCrossString2 || inCrossString3 || inCrossString4 || inCrossString5 || inCrossString6 || inCrossString7){
		return vec4(vec3(255, 1, 1) / 255., 1.); // red
	} else {
		return vec4(vec3(184, 243, 255) / 255., 1.); // background blue
	}
}

const float tau = 6.28318530717958647692;

// Gamma correction
// #define GAMMA (2.2)

vec3 ToLinear( in vec3 col )
{
	// simulate a monitor, converting colour values into light values
	return pow( col, vec3(2.2) );
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
void CamPolar( out vec3 pos, out vec3 ray, in vec3 origin, in vec2 rotation, in float distance, in float zoom, in vec2 fragCoord )
{
	// get rotation coefficients
	vec2 c = vec2(cos(rotation.x),cos(rotation.y));
	vec4 s;
	s.xy = vec2(sin(rotation.x),sin(rotation.y)); // worth testing if this is faster as sin or sqrt(1.0-cos);
	s.zw = -s.xy;

	// ray in view space
	ray.xy = fragCoord.xy - iResolution.xy*.5;
	ray.z = iResolution.y*zoom;
	ray = normalize(ray);
	localRay = ray;
	
	// rotate ray
	ray.yz = ray.yz*c.xx + ray.zy*s.zx;
	ray.xz = ray.xz*c.yy + ray.zx*s.yw;
	
	// position camera
	pos = origin - distance*vec3(c.x*s.y,s.z,c.x*c.y);
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
	vec3 albedo = vec3(1,.01,0);
	albedo = mix( vec3(.04), albedo, smoothstep( .25-aa, .25, abs(pos.y) ) );
	albedo = mix( mix( vec3(1), vec3(.04), smoothstep(-aa*4.0,aa*4.0,cos(atan(pos.x,pos.z)*6.0)) ), albedo, smoothstep( .2-aa*1.5, .2, abs(pos.y) ) );
	albedo = mix( vec3(.04), albedo, smoothstep( .05-aa*1.0, .05, abs(abs(pos.y)-.6) ) );
	albedo = mix( vec3(1,.8,.08), albedo, smoothstep( .05-aa*1.0, .05, abs(abs(pos.y)-.65) ) );
	
	vec3 col = albedo*light;
	
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
	
	vec2 camRot = vec2(.5,.5)+vec2(-.35,4.5)*(0.15);
	vec3 pos;
	vec3 ray;
	CamPolar( pos, ray, vec3(0), camRot, 3.0, 1.0, fragCoord );
	
	float to = TraceOcean( pos, ray );
	float tb = TraceBoat( pos, ray );
	
	vec3 result;
	if ( to > 0.0 && ( to < tb || tb == 0.0 ) )
		result = ShadeOcean( pos+ray*to, ray, fragCoord );
	else if ( tb > 0.0 )
		result = ShadeBoat( pos+ray*tb, ray );
	else
		result = Sky( ray );
	
	// vignette effect
	result *= 1.1*smoothstep( .35, 1.0, localRay.z );
	
	// fragColor = vec4(result, 1,0);
	fragColor = vec4(ToGamma(result),1.0);

	// // Normalized pixel coordinates (from 0 to 1)
    // vec2 uv = fragCoord/iResolution.xy;

    // // Time varying pixel color
    // vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));

    // // Output to screen
    // fragColor = vec4(col,1.0);
}

);

class A0_Driver : public Driver, public OpenGLViewer
{
	OpenGLScreenCover* screen_cover = nullptr;
	clock_t startTime = clock();

public:
	virtual void Initialize()
	{
		OpenGLViewer::Initialize();
	}

	//// Initialize the screen covering mesh and shaders
	virtual void Initialize_Data()
	{
		OpenGLShaderLibrary::Instance()->Create_Screen_Shader(draw_pixels, "shaderToy");
		screen_cover = Add_Interactive_Object<OpenGLScreenCover>();
		Set_Polygon_Mode(screen_cover, PolygonMode::Fill);
		Uniform_Update();

		screen_cover->Set_Data_Refreshed();
		screen_cover->Initialize();
		screen_cover->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("shaderToy"));
	}

	//// Update the uniformed variables used in shader
	void Uniform_Update()
	{
		screen_cover->setResolution((float)Win_Width(), (float)Win_Height());
		screen_cover->setTime(GLfloat(clock() - startTime) / CLOCKS_PER_SEC);
	}

	//// Go to next frame 
	virtual void Toggle_Next_Frame()
	{
		Uniform_Update();
		OpenGLViewer::Toggle_Next_Frame();
	}

	////Keyboard interaction
	virtual void Initialize_Common_Callback_Keys()
	{
		OpenGLViewer::Initialize_Common_Callback_Keys();
	}

	virtual void Run()
	{
		OpenGLViewer::Run();
	}
};

int main(int argc,char* argv[])
{
	if(author==""){std::cerr<<"***** The author name is not specified. Please put your name in the author string first. *****"<<std::endl;return 0;}
	else std::cout<<"Assignment 0 demo by "<<author<<" started"<<std::endl;

	A0_Driver driver;
	driver.Initialize();
	driver.Run();	
}

