//#####################################################################
// Main
// Dartmouth COSC 77/177 Computer Graphics, starter code
// Contact: Bo Zhu (bo.zhu@dartmouth.edu)
//#####################################################################
#include <iostream>
#include <vector>

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
#include "stb_image.h"

class A0_Driver : public Driver, public OpenGLViewer
{
	OpenGLScreenCover* screen_cover = nullptr;
	clock_t startTime;
	int frame;

public:
	unsigned int loadCubemap(std::vector<std::string> faces) {
		stbi_set_flip_vertically_on_load(false);
		unsigned int textureID;
		glGenTextures(1, &textureID);
		glBindTexture(GL_TEXTURE_CUBE_MAP, textureID);

		int width, height, nrChannels;
		for (unsigned int i = 0; i < faces.size(); i++)
		{
			unsigned char *data = stbi_load(faces[i].c_str(), &width, &height, &nrChannels, 0);
			stbi_set_flip_vertically_on_load(true);
			
			if (data)
			{
				glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
				stbi_image_free(data);
			}
			else
			{
				std::cout << "Cubemap tex failed to load at path: " << faces[i] << std::endl;
				stbi_image_free(data);
			}
		}
		glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
		glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
		glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
		glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
		glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);

		return textureID;
	}  

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
		OpenGLShaderLibrary::Instance()->Add_Shader_From_File(vertex_shader_file_name, fragment_shader_file_name, "A0_shader");
	
		// fragment_shader_file_name = "ray_tracing.frag";	
		// OpenGLShaderLibrary::Instance()->Add_Shader_From_File(vertex_shader_file_name, fragment_shader_file_name, "shader_buffer");
		screen_cover = Add_Interactive_Object<OpenGLScreenCover>();
		Set_Polygon_Mode(screen_cover, PolygonMode::Fill);
		Uniform_Update();

		screen_cover->Set_Data_Refreshed();
		screen_cover->Initialize();
		// screen_cover->Add_Buffer();
		screen_cover->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("A0_shader"));
		// screen_cover->Add_Shader_Program(OpenGLShaderLibrary::Get_Shader("shader_buffer"));


		std::vector<std::string> faces {
			// "negx.jpg", // right
			// "posx.jpg", // left
			// "posy.jpg", // top
			// "negy.jpg", // bottom
			// "posz.jpg", // back
			// "negz.jpg" // front

			"clouds1_east.bmp",
			"clouds1_west.bmp",
			"clouds1_up.bmp",
			"clouds1_down.bmp",
			"clouds1_south.bmp",
			"clouds1_north.bmp"
		};

		unsigned int cubemapTexture = loadCubemap(faces);

		glActiveTexture(GL_TEXTURE0);
		glBindTexture(GL_TEXTURE_CUBE_MAP, cubemapTexture);
	}

	//// Update the uniformed variables used in shader
	void Uniform_Update()
	{
		// screen_cover->setResolution((float)Win_Width(), (float)Win_Height());
		screen_cover->setTime(GLfloat(clock() - startTime) / CLOCKS_PER_SEC);
		screen_cover->setFrame(frame++);
		screen_cover->setResolution((float)Win_Width(), (float)Win_Height());
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
	Define_Function_Object(A0_Driver, Keyboard_Event_R);


	virtual void Run()
	{
		OpenGLViewer::Run();
	}
};

int main(int argc,char* argv[])
{
	A0_Driver driver;
	driver.Initialize();
	driver.Run();	
}

