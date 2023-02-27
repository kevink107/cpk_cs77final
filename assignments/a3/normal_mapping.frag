/*This is your fragment shader for texture and normal mapping*/

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

/*uniform variables*/
uniform float iTime;					////time
uniform sampler2D tex_albedo;			////texture color
uniform sampler2D tex_normal;			////texture normal

/*input variables*/
//// TODO: declare your input variables

/*output variables*/
out vec4 frag_color;

/*This part is the same as your previous assignment. Here we provide a default parameter set for the hard-coded lighting environment. Feel free to change them.*/
const vec3 LightPosition = vec3(3, 1, 3);
const vec3 LightIntensity = vec3(20);
const vec3 ka = 0.1*vec3(1., 1., 1.);
const vec3 kd = 0.7*vec3(1., 1., 1.);
const vec3 ks = vec3(2.);
const float n = 400.0;

void main()							
{		
	bool use_normal_mapping = false;	////TODO: set this flag to be true when you move from Step 2 to Step 3

	if(!use_normal_mapping){
		//// TODO (Step 1 and 2): texture with shading
		////Here are some useful hints:
		////Step 1.0: load the texture color from tex_albedo and then set it to frag_color
		////Step 2.0: use the loaded texture color as the local material color and multiply the local color with the Lambertian shading model you implemented previously to render a textured and shaded sphere.
		////The way to read a texture is to call texture(texture_name,uv). It will return a vec4.

		vec4 col = vec4(1.f);

		frag_color = vec4(col.rgb, 1);
	}
	else{
		//// TODO (Step 3): texture with normal mapping
		////Here are some useful hints:
		////Step 3.0: load the texture color from tex_albedo
		////Step 3.1: load the texture normal from tex_normal, and remap each component from [0, 1] to [-1, 1] (notice that currently the loaded normal is in the local tangent space)
		////Step 3.2: calculate the TBN matrix using the vertex normal and tangent
		////Step 3.3: transform the texture normal from the local tangent space to the global world space
		////Step 3.4 and following: use the transformed normal and the loaded texture color to conduct the further lighting calculation
		////The way to declare a 3x3 matrix is mat3 mat=mat3(v0,v1,v2);
		////The way to read a texture is to call texture(texture_name,uv). It will return a vec4.
		////The way to calculate cross product is to call cross(u1,u2);
		vec4 col = vec4(1.f);

		frag_color = vec4(col.rgb, 1);
	}
}	