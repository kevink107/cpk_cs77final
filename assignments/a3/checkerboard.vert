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
layout (location=3) in vec4 uv; 			/*vertex uv*/

/*output variables*/
//// TODO: declare your vertex attributes here
out vec4 vtx_color;
out vec3 vtx_normal;
out vec2 vtx_uv;
out vec3 vtx_pos;

void main()												
{
	/*camera-transformed position. do not modify.*/
	gl_Position=pvm*vec4(pos.xyz,1.f);

	//// TODO: pass attributes to fragment shader
	vtx_color = v_color;
	vtx_pos = pos.xyz;
	vtx_normal = vec3(normal.xyz);
	vtx_uv = vec2(uv.xy);
}

