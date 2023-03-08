for(int i=0;i<triangle_mesh.elements.size();i++){
			const Vector3i& tri=triangle_mesh.elements[i];
			for(int j=0;j<3;j++){
				Vector2i edge(tri[j],tri[(j+1)%3]);
				if(edge[0]>edge[1]){int tmp=edge[0];edge[0]=edge[1];edge[1]=tmp;}
				hashset.insert(edge);}}