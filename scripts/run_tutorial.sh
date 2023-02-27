set -e

tes=$2

if [ -z "$tes" ]
then
	tes=1;
fi

assignment=$1

echo "Building project $assignment"


cmake --build ./build --config Release --target $assignment

cd ./tutorials/$assignment
./../../build/tutorials/$assignment/$assignment $tes


cd ../..