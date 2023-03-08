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
in vec3 vtx_pos;
in vec3 vtx_nrm;

/*output variables*/
out vec4 frag_color;

/*hard-coded lighting parameters*/
const vec3 LightPosition = vec3(3, 1, 3);
////TODO [Step 2]: add your Lambertian lighting parameters here
const float K_a = 0.2;
const float K_d = 1.0;

const vec3 I_a = vec3(0.4, 0.4, 0.4);
const vec3 I_d = vec3(1.2, 1.2, 1.2);

void main()							
{		
	////TODO [Step 2]: add your Lambertian lighting calculation

	//// ambient
	vec3 ambient = K_a * I_a;
	
	//// diffuse
	vec3 n = normalize(vtx_nrm);
	vec3 l = normalize(LightPosition - vtx_pos);
	float l_dot_n = dot(l, n);
	vec3 diffuse = max(0, l_dot_n) * K_d * I_d * vtx_color.rgb;

	frag_color = vec4((min(vec3(1.,1.,1.), ambient) + min(vec3(1.,1.,1.), diffuse)), 1.f);
}	