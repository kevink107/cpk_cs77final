/*This is your first fragment shader!*/

#version 330 core

/*default camera matrices. do not modify.*/
layout (std140) uniform camera
{
	mat4 projection;	/*camera's projection matrix*/
	mat4 view;			/*camera's view matrix*/
	mat4 pvm;			/*camera's projection*view*model matrix*/
	mat4 ortho;			/*camera's ortho projection matrix*/
	vec4 position;		/*camera's position in world space*/
};

/* Passed time from the begining of the program */ 
uniform float iTime;

/*input variables*/
in vec4 vtx_color;
////TODO [Step 2]: add your in variables from the vertex shader

/*output variables*/
out vec4 frag_color;

/*hard-coded lighting parameters*/
const vec3 LightPosition = vec3(3, 1, 3);
////TODO [Step 2]: add your Lambertian lighting parameters here

void main()							
{		
	////TODO [Step 2]: add your Lambertian lighting calculation

	frag_color = vec4(0.f,1.f,0.f,1.f);
}	