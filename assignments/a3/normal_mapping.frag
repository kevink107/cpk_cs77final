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
uniform sampler2D tex_depth;

/*input variables*/
//// TODO: declare your input variables
in vec3 vtx_pos;
in vec3 vtx_nrm;
in vec3 vtx_tan;
in vec4 vtx_color;
in vec2 vtx_uv;

/*output variables*/
out vec4 frag_color;

/*This part is the same as your previous assignment. Here we provide a default parameter set for the hard-coded lighting environment. Feel free to change them.*/
const vec3 LightPosition = vec3(3,1,3); 	//// change to (75, -155, 600) for David sculpture
const vec3 LightIntensity = vec3(20);
const vec3 Ia = vec3(0.4, 0.4, 0.4);
const vec3 Id = vec3(1.8, 1.8, 1.8);
const vec3 ka = 0.1*vec3(1., 1., 1.);
const vec3 kd = 0.7*vec3(1., 1., 1.);
const vec3 ks = vec3(2.);
// const float n = 400.0;

void main()							
{		
	//// set both flags to TRUE to use displacement mapping, set just the first flag to TRUE to use regular normal mapping, set both flags to FALSE to just get texture and lambertian shading
	bool use_normal_mapping = true;	
	bool use_parallax_mapping = true;

	if(!use_normal_mapping){
		//// TODO (Step 1 and 2): texture with shading
		////Here are some useful hints:
		////Step 1.0: load the texture color from tex_albedo and then set it to frag_color
		////Step 2.0: use the loaded texture color as the local material color and multiply the local color with the Lambertian shading model you implemented previously to render a textured and shaded sphere.
		////The way to read a texture is to call texture(texture_name,uv). It will return a vec4.

		vec4 col = vec4(1.f);

		col=texture(tex_albedo, vtx_uv);

		//// ambient
		vec3 ambient = ka * Ia;
		
		//// diffuse
		vec3 n = normalize(vtx_nrm);
		vec3 l = normalize(LightPosition - vtx_pos);
		float l_dot_n = dot(l, n);
		vec3 diffuse = max(0, l_dot_n) * kd * Id * col.rgb;

		
		// frag_color = vec4(col);	//// rendering result for step 1 (just texture, no shading)
		frag_color = vec4(ambient + diffuse, 1); //// rendering result for step 2 (texture + shading)
	}
	else{
		//// TODO (Step 3): texture with normal mapping
		////Here are some useful hints:
		////Step 3.0: load the texture color from tex_albedo
		////Step 3.1: load the texture normal from tex_normal, and remap each component from [0, 1] to [-1, 1] (notice that currently the loaded normal is in the local tangent space)
		////Step 3.2: calculate the TBN matrix using the vtx_posex normal and tangent
		////Step 3.3: transform the texture normal from the local tangent space to the global world space
		////Step 3.4 and following: use the transformed normal and the loaded texture color to conduct the further lighting calculation
		////The way to declare a 3x3 matrix is mat3 mat=mat3(v0,v1,v2);
		////The way to read a texture is to call texture(texture_name,uv). It will return a vec4.
		////The way to calculate cross product is to call cross(u1,u2);

		vec3 T = normalize(vtx_tan);
		vec3 N = normalize(vtx_nrm);
		T = normalize(T - dot(T, N) * N);	//// gram-schmidt
		vec3 B = cross(vtx_nrm, vtx_tan);
		mat3 TBN = mat3(normalize(T), normalize(B), normalize(N));	//// 3.2

		if (!use_parallax_mapping){
			//// regular normal mapping (step 3)
			vec4 tex_color = texture(tex_albedo, vtx_uv);	//// 3.0
			vec3 tex_nrm = 2.0 * texture(tex_normal, vtx_uv).rgb - 1.0;	//// 3.1
			tex_nrm = normalize(TBN * tex_nrm);	//// 3.3

			//// 3.4
			//// ambient
			vec3 ambient = ka * Ia;
			
			//// diffuse
			vec3 n = normalize(tex_nrm);
			vec3 l = normalize(LightPosition - vtx_pos);
			float l_dot_n = dot(l, n);
			vec3 diffuse = max(0, l_dot_n) * kd * Id * tex_color.rgb;
			
			frag_color = vec4(ambient + diffuse, 1);
		} 
		else {
			//// displacement mapping (extra credit)
			vec3 TanViewPos = TBN * position.xyz;
			vec3 TanVecPos = TBN * vtx_pos;

			vec3 viewDir = normalize(TanViewPos - TanVecPos);

			float height_scale = 0.1;
			float height = texture(tex_depth, vtx_uv).r;
			vec2 p = viewDir.xy / viewDir.z * (height * height_scale);
			vec2 parrallax_coords = vtx_uv - p;

			vec4 tex_color = texture(tex_albedo, parrallax_coords);	//// 3.0
			vec3 tex_nrm = 2.0 * texture(tex_normal, parrallax_coords).rgb - 1.0;	//// 3.1
			tex_nrm = normalize(tex_nrm);

			//// ambient
			vec3 ambient = ka * Ia;
			
			//// diffuse
			vec3 n = normalize(tex_nrm);
			vec3 l = normalize(LightPosition - vtx_pos);
			float l_dot_n = dot(l, n);
			vec3 diffuse = max(0, l_dot_n) * kd * Id * tex_color.rgb;

			frag_color = vec4(ambient + diffuse, 1);
		}
	}
}	