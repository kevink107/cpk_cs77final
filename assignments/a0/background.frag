#version 330 core
uniform vec4 color=vec4(0.f,1.f,0.f,1.f);

in vec3 vtx_frg_pos;

out vec4 frag_color;

void main()								
{ 
	// Gradient color based on the y-coordinate of the fragment
    float gradient = (vtx_frg_pos.y + 1.0) / 2.0; // Map from [-1, 1] to [0, 1]
    vec3 skyColor = mix(vec3(0.8, 0.6, 1.0), vec3(0.6, 0.8, 1.0), gradient);

    // Set the final color of the fragment
    frag_color = vec4(skyColor, 1.0);
}	