#version 330 core

// Nothing to change in this file

layout (std140) uniform camera
{
	mat4 projection;
	mat4 view;
	mat4 pvm;
	mat4 ortho;
	vec4 position;
};

uniform mat4 model=mat4(1.0f);

layout (location=0) in vec4 pos;
layout (location=2) in vec4 normal;
layout (location=3) in vec4 uv;
layout (location=4) in vec4 tangent;

out vec3 vtx_pos;
out vec3 vtx_normal;

void main()												
{
	gl_Position = pvm * vec4(pos.xyz, 1);
	vtx_pos = pos.xyz;
	vtx_normal = normal.xyz;
}