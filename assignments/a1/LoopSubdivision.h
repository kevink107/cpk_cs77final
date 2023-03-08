#ifndef __LoopSubdivision_h__
#define __LoopSubdivision_h__
#include <iostream>
#include <ostream>
#include <unordered_map>
#include <vector>
#include "Mesh.h"

//// returns vector2i of an edge with edges sorted in ascending index order
inline Vector2i sorted(int x, int y)
{
	if (x < y){
		return Vector2i(x,y);
	}
	return Vector2i(y,x);
}

//// returns index of the opposite vertex of given edge in given triangle
inline int getOppVtx(Vector3i tri, Vector2i edge)
{
	for (int i = 0; i < 3; i++){
		if (tri[i] != edge[0] && tri[i] != edge[1]) return tri[i];
	}
	return -1;
}

//// returns weighted position of odd vertex given 4 neighboring vertices
inline Vector3 oddWeightAvg(Vector3 a, Vector3 b, Vector3 c, Vector3 d)
{
	return 0.375 * (a + b) + 0.125 * (c + d);
}

inline void LoopSubdivision(TriangleMesh<3>& mesh)
{
	std::vector<Vector3>& old_vtx=mesh.Vertices();
	std::vector<Vector3i>& old_tri=mesh.Elements();
	std::vector<Vector3> new_vtx;		////vertex array for the new mesh
	std::vector<Vector3i> new_tri;		////element array for the new mesh

	// create 3 aux maps
	std::unordered_map<Vector2i,int> edge_odd_vtx_map;
	std::unordered_map<Vector2i, std::vector<int> > edge_tri_map; 
	std::unordered_map<int, std::vector<int> > vtx_vtx_map; 
	
	new_vtx=old_vtx;	////copy all the old vertices to the new_vtx array

	////step 1: add mid-point vertices and triangles
	////for each old triangle, 
	////add three new vertices (in the middle of each edge) to new_vtx 
	////add four new triangles to new_tri

	/*your implementation here*/

	//// build edge_tri_map
	for (int i = 0; i < old_tri.size(); i++){
		const Vector3i& tri = old_tri[i];
		for(int j = 0; j < 3; j++){
			Vector2i edge = sorted(tri[j], tri[(j + 1) % 3]);
			if(edge_tri_map.find(edge) == edge_tri_map.end()){
				edge_tri_map[edge] = std::vector<int>(); //// set up new array if unseen edge
			}
			edge_tri_map[edge].push_back(i);
		}
	}

	//// add mid-point vertices to each edge
	for(int i = 0; i < old_tri.size(); i++){
		const Vector3i& tri = old_tri[i];
		for(int j = 0; j < 3; j++){
			Vector2i edge = sorted(tri[j], tri[(j + 1) % 3]);
			if(edge_odd_vtx_map.find(edge) != edge_odd_vtx_map.end()) continue; //// continue if the current edge has already been processsed
			Vector3 pos = 0.5 * (new_vtx[edge[0]] + new_vtx[edge[1]]);
			new_vtx.push_back(pos);
			edge_odd_vtx_map[edge] = new_vtx.size() - 1;
		}
	}

	//// add new triangles to new_tri
	for (int i = 0; i < old_tri.size(); i++){
		const Vector3i& tri = old_tri[i];
		const int mid1 = edge_odd_vtx_map[sorted(tri[0], tri[1])];
		const int mid2 = edge_odd_vtx_map[sorted(tri[1], tri[2])];
		const int mid3 = edge_odd_vtx_map[sorted(tri[0], tri[2])];
		new_tri.push_back(Vector3i(mid1, mid2, mid3));
		new_tri.push_back(Vector3i(tri[0], mid1, mid3));
		new_tri.push_back(Vector3i(mid1, tri[1], mid2));
		new_tri.push_back(Vector3i(mid3, mid2, tri[2]));
	}

	
	////step 2: update the position for each new mid-point vertex: 
	////for each mid-point vertex, find its two end-point vertices A and B, 
	////and find the two opposite-side vertices on the two incident triangles C and D,
	////then update the new position as .375*(A+B)+.125*(C+D)

	/*your implementation here*/

	for (const auto it : edge_odd_vtx_map){
		Vector2i curr_edge = sorted(it.first[0], it.first[1]);
		if (edge_tri_map[curr_edge].size() < 2){	//// crease edges
			new_vtx[it.second] = 0.5 * (old_vtx[curr_edge[0]] + old_vtx[curr_edge[1]]);
		} else {
			Vector3i t0 = old_tri[edge_tri_map[curr_edge][0]];
			Vector3i t1 = old_tri[edge_tri_map[curr_edge][1]];
			Vector3 oppV1 = old_vtx[getOppVtx(t0, curr_edge)];
			Vector3 oppV2 = old_vtx[getOppVtx(t1, curr_edge)];
			new_vtx[it.second] = oddWeightAvg(old_vtx[curr_edge[0]], old_vtx[curr_edge[1]], oppV1, oppV2);
		}
	}

	////step 3: update vertices of each old vertex
	////for each old vertex, find its incident old vertices, and update its position according its incident vertices

	/*your implementation here*/

	std::vector<Vector3> new_even_vtx;	//// auxiliary vector for updating even vertices
	new_even_vtx = new_vtx;	

	// build vtx_vtx_map from coarse mesh
	//// borrowed from tutorials/tutorial_mesh
	for(int i = 0; i < old_tri.size(); i++){
		Vector3i& curr_tri = old_tri[i];
		for(int j = 0; j < 3; j++){
			if(vtx_vtx_map.find(curr_tri[j]) == vtx_vtx_map.end()){
				vtx_vtx_map[curr_tri[j]] = std::vector<int>();
			}
			std::vector<int>& nbs = vtx_vtx_map[curr_tri[j]];
			for(int k = 0; k < 3; k++){
				if(curr_tri[k] == curr_tri[j]) continue;
				if(std::find(nbs.begin(), nbs.end(), curr_tri[k]) != nbs.end()) continue;
				nbs.push_back(curr_tri[k]);
			}
		}
	}


	// for each vtx in vtx_vtx_map
	for (const auto it: vtx_vtx_map){
		// count nbs and create beta
		int curr_vtx = it.first;
		float num_nbs = it.second.size() * 1.0;
		float beta;
		if (num_nbs < 3){
			beta = 1.0 / 8.0;	//// boundary case
		} else if (num_nbs == 3){
			beta = 3.0 / 16.0;
		} else {
			beta = 3.0 / (num_nbs * 8.0);
		}
		// weight pos of smoothed even vertex
		Vector3 pos = (1.0 - (num_nbs * beta)) * old_vtx[curr_vtx];
		for (int nb_vtx : it.second){
			pos += (beta * old_vtx[nb_vtx]);
		}
		new_even_vtx[curr_vtx] = pos;
	}


	////update subdivided vertices and triangles onto the input mesh
	old_vtx=new_even_vtx;
	old_tri=new_tri;
}

#endif