/*Hello fragment shader!*/

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
////TODO: define your own data channel(s) to receive the normal attribute from the vertex shader
in vec3 vtx_normal;

/*output variables*/
out vec4 frag_color;	/*or use gl_FragColor*/

void main()							
{	
	////This is the default implementation of the fragment color. Change it to the color depending on the input normal value.
	//// STEP 0: various colors for frag
	frag_color = vec4(vtx_color.rgb,1.f);

	//// UNCOMMENT ONE OF THE FOLLOWING FOR A DIFFERENT COLOR SCHEME
	// frag_color = vec4(vtx_normal.r, vtx_color.g*vtx_normal.g, vtx_color.b,1.f);
	// frag_color = vec4(min(sin(vtx_normal.y), 0.2), tan(vtx_normal.x / vtx_color.b), 0.4 ,1.f);
	frag_color = vec4(mix(vtx_normal.xyz, vtx_color.rgb, sin(iTime)),1.f);
}	