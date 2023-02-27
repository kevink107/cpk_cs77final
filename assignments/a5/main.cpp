//#####################################################################
// Main
// Dartmouth COSC 77/177 Computer Graphics, starter code
// Contact: Bo Zhu (bo.zhu@dartmouth.edu)
//#####################################################################
#include <iostream>

#include <random>
#include "Common.h"
#include "Driver.h"
#include "Particles.h"
#include "OpenGLMesh.h"
#include "OpenGLCommon.h"
#include "OpenGLWindow.h"
#include "OpenGLViewer.h"
#include "OpenGLMarkerObjects.h"
#include "OpenGLParticles.h"

class A5_Driver : public Driver, public OpenGLViewer
{
	OpenGLScreenCover* screen_cover = nullptr;
	clock_t startTime;
	int frame;

public:
	virtual void Initialize()
	{
		startTime = clock();
		frame = 1;
		OpenGLViewer::Initialize();
		Disable_Resize_Window(); // Changing window size would cause trouble in progressive rendering
	}

	//// Initialize the screen covering mesh and shaders
	virtual void Initialize_Data()
	{
		std::string vertex_shader_file_name = "common.vert";
		std::string fragment_shader_file_name = "basic_frag.frag";
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File(vertex_shader_file_name, fragment_shader_file_name, "a5_shader");
	
		fragment_shader_file_name = "ray_tracing.frag";	
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File(vertex_shader_file_name, fragment_shader_file_name, "shader_buffer");
		screen_cover = Add_Interactive_Object<OpenGLScreenCover>();
		Set_Polygon_Mode(screen_cover, PolygonMode::Fill);
		Uniform_Update();

		screen_cover->Set_Data_Refreshed();
		screen_cover->Initialize();
		screen_cover->Add_Buffer();
		screen_cover->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("a5_shader"));
		screen_cover->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("shader_buffer"));
	}

	//// Update the uniformed variables used in shader
	void Uniform_Update()
	{
		// screen_cover->setResolution((float)Win_Width(), (float)Win_Height());
		screen_cover->setTime(GLfloat(clock() - startTime) / CLOCKS_PER_SEC);
		screen_cover->setFrame(frame++);
	}

	//// Go to next frame 
	virtual void Toggle_Next_Frame()
	{
		Uniform_Update();
		OpenGLViewer::Toggle_Next_Frame();
	}

	////Keyboard interaction
	virtual void Initialize_Common_Callback_Keys()
	{
		OpenGLViewer::Initialize_Common_Callback_Keys();
		Bind_Callback_Key('r', &Keyboard_Event_R_Func, "Restart");
	}

	virtual void Keyboard_Event_R()
	{
		std::cout << "Restart" << std::endl;
		startTime = clock();
		frame = 1;
	}
	Define_Function_Object(A5_Driver, Keyboard_Event_R);


	virtual void Run()
	{
		OpenGLViewer::Run();
	}
};

int main(int argc,char* argv[])
{
	A5_Driver driver;
	driver.Initialize();
	driver.Run();	
}

