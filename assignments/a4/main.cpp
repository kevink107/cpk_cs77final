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
#include "TinyObjLoader.h"

#ifndef __Main_cpp__
#define __Main_cpp__

#ifdef __APPLE__
#define CLOCKS_PER_SEC 100000
#endif

class NoiseDriver : public Driver, public OpenGLViewer
{using Base=Driver;
	std::vector<OpenGLTriangleMesh*> mesh_object_array;		////mesh objects, every object you put in this array will be rendered.
	clock_t startTime;
	const int part = 2;										////TODO: set the value of part to be 2 when working on part 2

public:
	virtual void Initialize()
	{
		draw_bk=true;						////this flag specifies a customized way to draw the background. If you turn it off, there is no background.
		draw_axes=false;					////if you don't like the axes, turn them off!
		startTime = clock();
		OpenGLViewer::Initialize();
	}

	////This function adds a mesh object from an obj file
	int Add_Obj_Mesh_Object(std::string obj_file_name)
	{
		auto mesh_obj=Add_Interactive_Object<OpenGLTriangleMesh>();

		Array<std::shared_ptr<TriangleMesh<3> > > meshes;
		Obj::Read_From_Obj_File_Discrete_Triangles(obj_file_name,meshes);
		mesh_obj->mesh=*meshes[0];
		std::cout<<"load tri_mesh from obj file, #vtx: "<<mesh_obj->mesh.Vertices().size()<<", #ele: "<<mesh_obj->mesh.Elements().size()<<std::endl;		

		mesh_object_array.push_back(mesh_obj);
		return (int)mesh_object_array.size()-1;
	}

	virtual void Initialize_Data()
	{
		std::string name = "model";
		if(part ==1)
			name = "perlin";
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File(name + ".vert", name +".frag", "a4_shader");		
		////add the plane mesh object
		int obj_idx=Add_Obj_Mesh_Object("plane.obj");
		auto plane_obj=mesh_object_array[obj_idx];
		plane_obj->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("a4_shader"));

		Set_Polygon_Mode(plane_obj, PolygonMode::Fill);
		Set_Shading_Mode(plane_obj, ShadingMode::Texture);
		plane_obj->Set_Data_Refreshed();
		plane_obj->Initialize();
	}

	//// Go to next frame 
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
	NoiseDriver driver;
	driver.Initialize();
	driver.Run();	
}

#endif
