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

/*input variables*/
//// TODO: declare the input fragment attributes here

/*output variables*/
out vec4 frag_color;

void main()							
{						
	vec3 col = vec3(1.0);

	//// TODO: produce a checkerboard texture on the sphere with the input vertex uv

	frag_color = vec4(col, 1.0);
}	