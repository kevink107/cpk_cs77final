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
in vec4 vtx_color;
in vec3 vtx_nomral;
in vec3 vtx_pos;
in vec2 vtx_uv;

/*output variables*/
out vec4 frag_color;

void main()							
{						
	//// TODO: produce a checkerboard texture on the sphere with the input vertex uv
	const float W = 12.;
	const float H = 12.;

	//// do uv calculation on vtx_pos to fix seam artifact
	float radius = sqrt(pow(vtx_pos.x, 2) + pow(vtx_pos.y, 2) + pow(vtx_pos.z, 2));
	float theta = atan(-vtx_pos.x, -vtx_pos.z);
	float phi = asin(-vtx_pos.y / radius);

	float u = theta / (2 * 3.14);
	u += 0.5;
	float v = phi / 3.14 + 0.5;
	
	float u2 = floor(u * W);
	float v2 = floor(v * H);
	
	float sum = u2 + v2;
	if (mod(sum, 2.0) == 0)
		frag_color = vec4(1., 1., 1., 1.);
	else 
		frag_color = vec4(0., 0., 0., 1.);
}	