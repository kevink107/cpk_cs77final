//#####################################################################
// Main
// Dartmouth COSC 77/177 Computer Graphics, starter code
// Contact: Bo Zhu (bo.zhu@dartmouth.edu)
//#####################################################################
#include <iostream>
#include <random>
#include <vector>
#include <algorithm>
#include <unordered_set>
#include "Common.h"
#include "Driver.h"
#include "OpenGLMesh.h"
#include "OpenGLCommon.h"
#include "OpenGLWindow.h"
#include "OpenGLViewer.h"
#include "OpenGLMarkerObjects.h"
#include "TinyObjLoader.h"

#ifndef __Main_cpp__
#define __Main_cpp__

#ifdef __APPLE__
#define CLOCKS_PER_SEC 100000
#endif

class FinalProjectDriver : public Driver, public OpenGLViewer
{using Base=Driver;
	std::vector<OpenGLTriangleMesh*> mesh_object_array;						////mesh objects, every object you put in this array will be rendered.
	clock_t startTime;

public:
	virtual void Initialize()
	{
		draw_bk=false;						////turn off the default background and use the customized one
		draw_axes=true;						////if you don't like the axes, turn them off!
		startTime=clock();
		OpenGLViewer::Initialize();
	}

	void Add_Shaders()
	{
		////format: vertex shader name, fragment shader name, shader name
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File("background.vert","background.frag","background");	

		////SHADOW TODO: uncomment next three lines to import shadow shaders
		//OpenGLShaderLibrary::Instance()->Add_Shader_From_File("object_1_shadow.vert","object_1_shadow.frag","object_1_shadow");	
		//OpenGLShaderLibrary::Instance()->Add_Shader_From_File("object_2_shadow.vert","object_2_shadow.frag","object_2_shadow");	
		//OpenGLShaderLibrary::Instance()->Add_Shader_From_File("object_3_shadow.vert","object_3_shadow.frag","object_3_shadow");	

		////SHADOW TODO: comment out next three lines
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File("object_1.vert","object_1.frag","object_1");	
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File("object_2.vert","object_2.frag","object_2");	
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File("object_3.vert","object_3.frag","object_3");	
	}

	void Add_Textures()
	{
		////format: image name, texture name
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("earth_albedo.png", "object_1_albedo");		
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("earth_normal.png", "object_1_normal");
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("earth_albedo.png", "object_2_albedo");		
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("earth_normal.png", "object_2_normal");
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("earth_albedo.png", "object_3_albedo");		
		OpenGLTextureLibrary::Instance()->Add_Texture_From_File("earth_normal.png", "object_3_normal");

	}

	void Add_Background()
	{
		OpenGLBackground* opengl_background=Add_Interactive_Object<OpenGLBackground>();
		opengl_background->shader_name="background";
		opengl_background->Initialize();
	}

	////this is an example of adding a mesh object read from obj file
	int Add_Object_1()
	{
		auto mesh_obj=Add_Interactive_Object<OpenGLTriangleMesh>();

		////read mesh file
		std::string obj_file_name="bunny.obj";
		Array<std::shared_ptr<TriangleMesh<3> > > meshes;
		Obj::Read_From_Obj_File_Discrete_Triangles(obj_file_name,meshes);
		mesh_obj->mesh=*meshes[0];

		////This is an example showing how to access and modify the values of vertices on the CPU end.
		//std::vector<Vector3>& vertices=mesh_obj->mesh.Vertices();
		//int vn=(int)vertices.size();
		//for(int i=0;i<vn;i++){
		//	vertices[i]+=Vector3(1.,0.,0.);
		//}

		////This is an example of creating a 4x4 matrix for GLSL shaders. Notice that the matrix is column-major (instead of row-major!)
		////The code for passing the matrix to the shader is in OpenGLMesh.h
		mesh_obj->model_matrix=
			glm::mat4(1.f,0.f,0.f,0.f,		////column 0
					  0.f,1.f,0.f,0.f,		////column 1
					  0.f,0.f,1.f,0.f,		////column 2
					  0.f,1.f,0.f,1.f);		////column 3	////set the translation in the last column

		////set up shader
		//mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("object_1_shadow"));//Shadow TODO: uncomment this line and comment next line to use shadow shader
		mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("object_1"));
		
		////set up texture
		mesh_obj->Add_Texture("tex_albedo", OpenGLTextureLibrary::Get_Texture("object_1_albedo"));
		mesh_obj->Add_Texture("tex_normal", OpenGLTextureLibrary::Get_Texture("object_1_normal"));
		Set_Polygon_Mode(mesh_obj,PolygonMode::Fill);
		Set_Shading_Mode(mesh_obj,ShadingMode::Texture);//SHADOW TODO: set Shading Mode to Shadow
		
		////initialize
		mesh_obj->Set_Data_Refreshed();
		mesh_obj->Initialize();	
		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size()-1;
	}

	////this is an example of adding a spherical mesh object generated analytically
	int Add_Object_2()
	{
		auto mesh_obj=Add_Interactive_Object<OpenGLTriangleMesh>();

		real radius=1.;
		Initialize_Sphere_Mesh(radius,&mesh_obj->mesh,3);		////add a sphere with radius=1. if the obj file name is not specified
		
		////set up shader
		//mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("object_2_shadow"));//Shadow TODO: uncomment this line and comment next line to use shadow shader
		mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("object_2"));
		
		////set up texture
		mesh_obj->Add_Texture("tex_albedo", OpenGLTextureLibrary::Get_Texture("object_2_albedo"));
		mesh_obj->Add_Texture("tex_normal", OpenGLTextureLibrary::Get_Texture("object_2_normal"));
		
		Set_Polygon_Mode(mesh_obj,PolygonMode::Fill);
		Set_Shading_Mode(mesh_obj,ShadingMode::Texture);//SHADOW TODO: Set Shading Mode to Shadow
		
		////initialize
		mesh_obj->Set_Data_Refreshed();
		mesh_obj->Initialize();	
		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size()-1;
	}

	////this is an example of adding an object with manually created triangles and vertex attributes
	int Add_Object_3()
	{
		auto mesh_obj=Add_Interactive_Object<OpenGLTriangleMesh>();
		auto& mesh=mesh_obj->mesh;

		////vertex position
		std::vector<Vector3> triangle_vertices={Vector3(-1,-1,-1),Vector3(1,-1,-1),Vector3(-1,-1,1),Vector3(1,-1,1)};
		std::vector<Vector3>& vertices=mesh_obj->mesh.Vertices();
		vertices=triangle_vertices;
			
		////vertex color
		std::vector<Vector4f>& vtx_color=mesh_obj->vtx_color;
		vtx_color={Vector4f(1.f,0.f,0.f,1.f),Vector4f(0.f,1.f,0.f,1.f),Vector4f(0.f,0.f,1.f,1.f),Vector4f(1.f,1.f,0.f,1.f)};

		////vertex normal
		std::vector<Vector3>& vtx_normal=mesh_obj->vtx_normal;
		vtx_normal={Vector3(0.,1.,0.),Vector3(0.,1.,0.),Vector3(0.,1.,0.),Vector3(0.,1.,0.)};

		////vertex uv
		std::vector<Vector2>& uv=mesh_obj->mesh.Uvs();
		uv={Vector2(0.,0.),Vector2(1.,0.),Vector2(0.,1.),Vector2(1.,1.)};

		////mesh elements
		std::vector<Vector3i>& elements=mesh_obj->mesh.Elements();
		elements={Vector3i(0,1,3),Vector3i(0,3,2)};

		////set up shader
		//mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("object_3_shadow"));//Shadow TODO: uncomment this line and comment next line to use shadow shader
		mesh_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("object_3"));
		
		////set up texture
		mesh_obj->Add_Texture("tex_albedo", OpenGLTextureLibrary::Get_Texture("object_3_albedo"));
		mesh_obj->Add_Texture("tex_normal", OpenGLTextureLibrary::Get_Texture("object_3_normal"));
		Set_Polygon_Mode(mesh_obj,PolygonMode::Fill);
		Set_Shading_Mode(mesh_obj,ShadingMode::Texture);//SHADOW TODO: Set Shading Mode to Shadow

		////initialize
		mesh_obj->Set_Data_Refreshed();
		mesh_obj->Initialize();	
		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size()-1;
	}

	//// Use this function to set up lighting only if you are using Shadow mode
	void Init_Lighting() {
		auto dir_light = OpenGLUbos::Add_Directional_Light(glm::vec3(-1.f, -1.f, -1.f));//Light direction
		dir_light->dif = glm::vec4(.9,.8,.7, 1.0);//diffuse reflection color
		dir_light->Set_Shadow();////SHADOW TODO: turn on the shadow by uncommenting this line, currenly our base code only supports shadow for one light

		//This is an example to add a second directional light
		//auto dir_light_2 = OpenGLUbos::Add_Directional_Light(glm::vec3(1.,1.,1.));//the parameter is light direction
		//dir_light_2->dif = glm::vec4(.9,.9,.9,1.0);
		//dir_light_2->spec = glm::vec4(.2,.2,.2,1.0);

		//This is an example to add a point light
		//auto point_light = OpenGLUbos::Add_Point_Light(glm::vec3(1.,1.,1.));//the parameter is the position of point light
		//point_light->dif = glm::vec4(.9,.8,.7, 1.0);

		//This is an example to add a spot light
		//auto spot_light = OpenGLUbos::Add_Spot_Light(glm::vec3(1.,1.,1.),glm::vec3(1.,1.,1.));//first param: position, second param: direction
		//spot_light->dif = glm::vec4(.9,.8,.7, 1.0);

		OpenGLUbos::Set_Ambient(glm::vec4(.01f, .01f, .02f, 1.f));
		OpenGLUbos::Update_Lights_Ubo();	
	}

	virtual void Initialize_Data()
	{
		Add_Shaders();
		Add_Textures();

		Add_Background();
		Add_Object_1();
		Add_Object_2();
		Add_Object_3();

		//Init_Lighting(); ////SHADOW TODO: uncomment this line
	}

	////Goto next frame 
	virtual void Toggle_Next_Frame()
	{
		for (auto& mesh_obj : mesh_object_array) {
			mesh_obj->setTime(GLfloat(clock() - startTime) / CLOCKS_PER_SEC);
		}
		OpenGLViewer::Toggle_Next_Frame();
	}

	virtual void Run()
	{
		OpenGLViewer::Run();
	}
};

int main(int argc,char* argv[])
{
	FinalProjectDriver driver;
	driver.Initialize();
	driver.Run();	
}

#endif