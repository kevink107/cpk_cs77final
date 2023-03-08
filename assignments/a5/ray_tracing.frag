#version 330 core

uniform vec2 iResolution;
uniform float iTime;
uniform int iFrame;
in vec2 fragCoord; 
out vec4 fragColor;

uniform sampler2D bufferTexture;

#define M_PI 3.1415925585

////data structures for ray tracing
struct camera{
    vec3 origin;
    vec3 horizontal;
    vec3 vertical;
    vec3 LowerLeftCorner;
};

struct ray{
    vec3 ori;
    vec3 dir;
};

struct sphere{
    vec3 ori;			////sphere center
    float r;			////sphere radius
    vec3 color;			////sphere color
};

struct light {
   vec3 position;		////point light position
   vec3 color;			////point light color
};
    
struct hit{
    float t;			////parameter in the ray function
    vec3 p;				////intersection point
    vec3 normal;		////normal on the intersection point
    vec3 color;			////color of the intersecting object
};

//////////// Random functions ///////////
float g_seed = 0.;

uint base_hash(uvec2 p) {
    p = 1103515245U*((p >> 1U)^(p.yx));
    uint h32 = 1103515245U*((p.x)^(p.y>>3U));
    return h32^(h32 >> 16);
}

void init_rand(in vec2 frag_coord, in float time) {
    g_seed = float(base_hash(floatBitsToUint(frag_coord)))/float(0xffffffffU)+time;
}

vec2 rand2(inout float seed) {
    uint n = base_hash(floatBitsToUint(vec2(seed+=.1,seed+=.1)));
    uvec2 rz = uvec2(n, n*48271U);
    return vec2(rz.xy & uvec2(0x7fffffffU))/float(0x7fffffff);
}
/////////////////////////////////////////

const float minT = 0.001;
const float maxT = 1e8;
const int numberOfSampling = 50;

////if no hit is detected, return dummyHit
const hit dummyHit = hit(-1.0, vec3(0), vec3(0), vec3(0));

////calculate the ray for a given uv coordinate
ray getRay(camera c, vec2 uv)
{
    return ray(c.origin, c.LowerLeftCorner + uv.x * c.horizontal + uv.y * c.vertical - c.origin);
}

////TODO: implement ray-sphere intersection
hit hitSphere(const ray r, const sphere s)
{
    float delta = 0.f;
	////TODO: check whether r is interescting with s by updating delta
	/*Your implementation*/
    vec3 OC = r.ori - s.ori; //// O - C
    float a = dot(r.dir, r.dir);
    float b = 2.0 * dot(r.dir, OC);
    float c = dot(OC, OC) - s.r*s.r;
    delta = b*b - 4.0*a*c;
    if(delta<0.0){
        // no solution, return dummy
        return  dummyHit;
    }
    else {
		hit h;
		h.color=s.color;

		////TODO: update other attributes of hit when an intersection is detected
		/*Your implementation*/
        if (delta == 0.0) h.t = -0.5 * b / a;

        float root1 = (-b - sqrt(delta)) / (2.0 * a);
        float root2 = (-b + sqrt(delta)) / (2.0 * a);
        if ((root1 < 0) && (root2 < 0)) return dummyHit;
        else if ((root1 < 0) && (root2 >= 0)) h.t = root2;
        else if ((root2 < 0) && (root1 >= 0)) h.t = root1;
        else if (root1 <= root2) h.t = root1;
        else if (root2 <= root1) h.t = root2;

        if (h.t < minT || h.t > maxT) return dummyHit; 
        
        h.p = r.ori + r.dir*h.t;
        h.normal = normalize(h.p - s.ori);
        return h; 
    }
}

////TODO: return the hit sphere with the smallest t
hit findHit(ray r, sphere[4] s) 
{
	hit h = dummyHit;
    ////TODO: traverse all the spheres and find the intersecting one with the smallest t value
	/*Your implementation*/
    float temp_min = maxT;
    for (int i = 0; i < 4; i++){
        hit curr = hitSphere(r, s[i]);
        if (curr.t < temp_min && curr.t > minT){
            temp_min = curr.t;
            h = curr;
        }
    }

	return h;
}

////TODO: calculate the pixel color for each ray
vec3 color(ray r, sphere[4] s, light[2] l)
{
    vec3 col = vec3(0);
    hit h = findHit(r, s);
    if(h.t > 0.){
		////TODO: traverse all the lights and calculate the color contribution from each of them
		////TODO: send an additional shadow ray for each light to implement the shadow effect
		/*Your implementation*/
        const float epsilon = 1e-3;
        for(int i = 0; i < 2; i++){
            light currLight = l[i];
            vec3 lightDir = currLight.position - h.p;
            ray shadowRay = ray(h.p + epsilon, lightDir);
            if (findHit(shadowRay, s) == dummyHit){
                vec3 n = normalize(h.normal);
                col += max(0, dot(n, normalize(lightDir))) * currLight.color * h.color;
            }
        }
    }
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    camera c = camera(vec3(0,15,50), vec3(5, 0, 0), vec3(0, 3, -3), vec3(-2.5, -1.5, -1));
    sphere s[4];
    s[0] = sphere(vec3(0, 0.6, -1), 0.6, vec3(0.8,0.2,0.2));
	s[1] = sphere(vec3(1.2, 0.4, -1), 0.4, vec3(0.2,0.9,0.2));
	s[2] = sphere(vec3(-1.2, 0.5, -1), 0.5, vec3(0.2,0.2,0.9));
    s[3] = sphere(vec3(0, -200, -1),200.0, vec3(0.5,0.5,0.5));

	light l[2];
	l[0] = light(vec3(-1, 3, 0.5), vec3(1));
	l[1] = light(vec3(0.5, 2, 1), vec3(1));
    vec3 resultCol = vec3(0);

    // Here I use i to get differnet seeds for each run
    init_rand(fragCoord, iTime);
    vec2 random = rand2(g_seed);
    ray r = getRay(c, uv + random/iResolution.xy);
    resultCol += color(r, s, l);
    
	// Output to screen
    fragColor = vec4((resultCol + float(iFrame-1) * texture(bufferTexture, uv).xyz)/float(iFrame), 1.);
}

void main() {
	mainImage(fragColor, fragCoord);
}
