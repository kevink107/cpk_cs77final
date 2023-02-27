/*This is your first vertex shader!*/

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

/*input variables*/
layout (location=0) in vec4 pos;			/*vertex position*/
layout (location=1) in vec4 v_color;		/*vertex color*/
layout (location=2) in vec4 normal;			/*vertex normal*/

/*output variables*/
out vec4 vtx_color;
////TODO: add your out variables to the fragment shader

void main()												
{
	/*camera-transformed position. do not modify.*/
	gl_Position=pvm*vec4(pos.xyz,1.f);

	vtx_color=vec4(v_color.rgb,1.f);
	
	////TODO: add your operations on the out varialbes
}	