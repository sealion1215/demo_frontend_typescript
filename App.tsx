import React, { PureComponent } from 'react';
import { Camera } from 'expo-camera';
import * as Permissions from 'expo-permissions';
import { Button, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import config from './config';

interface IOCRProperty {}
interface IOCRState {
  hasCameraPermission: boolean,
  type: any,
  cameraReady: boolean,
  useSavedPicture: boolean,
  textContent: string
}
export default class OCRApp extends PureComponent<IOCRProperty, IOCRState> {
  camera!: Camera | null;

  constructor(props: Readonly<{}>) {
    super(props);
    this.cameraReady = this.cameraReady.bind(this);
    this.snap = this.snap.bind(this);
    this.convertImageToBase64 = this.convertImageToBase64.bind(this);
    this.state = {
      hasCameraPermission: false,
      type: Camera.Constants.Type.back,
      cameraReady: false,
      useSavedPicture: false,
      textContent: 'Hello World 32!'
    };
  }

  styles = StyleSheet.create({
    cameraInterior: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'flex-end'
    },
    buttonExterior: {
      borderWidth: 2,
      borderRadius:0.5,
      borderColor: 'white',
      height: 50,
      width:50,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    buttonInterior: {
      borderWidth: 2,
      borderRadius:0.5,
      borderColor: 'white',
      height: 40,
      width:40,
      backgroundColor: 'white'
    },
    textStyle: {
      alignSelf: 'center',
      fontSize: 20
    }
  });
  
  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' }, () => console.log(this.state));
  }

  cameraReady = () => {
    this.setState({cameraReady: true}, () => console.log("Camera is ready"));
  }

  snap = async () => {
    console.log('taking picture');
    const { useSavedPicture } = this.state; 
    let imageToServer = await this.convertImageToBase64(useSavedPicture);
    if (imageToServer !== '') {
      let url = config.SERVER_BASE_URL+'/ocrreaders/english';
      fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageToServer,
          isBase64String: true
          // isBase64String: !useSavedPicture
        })
      }).then(async response => {
        let json = await response.json();
        this.setState({ textContent: json.result });
        console.log(json);
      }).catch(error => {
        console.log('error: ');
        console.log(error);
      });
    }
  }

  convertImageToBase64 = async (useSavedPicture: boolean) => {
    const { cameraReady } = this.state;
    if (useSavedPicture) {
      return new Promise<string>(resolve => {
        const canvas = document.createElement('canvas');
        const localImage = new Image();
        localImage.src = require('./test_images/A.jpg');
        localImage.onload = () => {
          canvas.width = localImage.width;
          canvas.height = localImage.height;
          canvas.getContext('2d')?.drawImage(localImage, 0, 0);
          resolve(canvas.toDataURL());
        }
      });
    } else {
      const options = {
        quality: 1,
        base64: true
      }
      if (this.camera && cameraReady) {
        const picture = await this.camera.takePictureAsync(options);
        return picture.uri;
      }
      return '';
    }  
  }

  render() {
    const { type, textContent, useSavedPicture } = this.state;
    return (
      <View 
        // style={{flex: 1}}
      >
        {/* <View style={{flex: 0.1}}>
          <Text style={this.styles.textStyle}>
            {'Optical Character Recognition'}
          </Text>
          
        </View> */}
        {/* <View style={{flex: 0.8}}> */}
          {
            useSavedPicture?
            <View>
              <img src={require('./test_images/A.jpg')}/>
              <Button
                onPress={this.snap}
                title="Identify picture"
                color="#841584"
                accessibilityLabel="Identify picture"
              /> 
            </View>:
            <View style={{flex: 0.8}}>
              <Camera
                ref={(ref: any) => this.camera = ref}
                style={{flex: 1, height: '80%'}}
                type={type}
                flashMode={Camera.Constants.FlashMode.auto}
                onCameraReady={this.cameraReady}
              >
                <View style={this.styles.cameraInterior}>
                  <TouchableOpacity 
                    style={{alignSelf: 'center'}}
                    onPress={this.snap}
                  >
                    <View style={this.styles.buttonExterior}>
                      <View style={this.styles.buttonInterior}/>
                    </View>
                  </TouchableOpacity>
                </View>
              </Camera>
            </View>  
          }
        {/* </View> */}
        <View 
          style={{flex: 0.1, height: '10%'}}
        >
          <Text style={this.styles.textStyle}>
            {textContent}
          </Text>
        </View>
      </View>
    );
  }
}