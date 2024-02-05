import {Button, Center, CircularProgress, Flex, Spinner, Text} from "@chakra-ui/react";
import {TrimmerOutput} from "./Trimmer";
import {StorageError, UploadTask, UploadTaskSnapshot, getStorage, ref, uploadBytesResumable} from "firebase/storage";
import {useAsync} from "react-use";
import {extractAudio} from "./extract";
import {useEffect, useState} from "react";
import {Unsubscribe} from "firebase/auth";


export function Uploader({start, end, title, url}: TrimmerOutput) {
  const [uploaded, setUploaded] = useState<UploadTask | null>(null);
  const extracted = useAsync(async () => {
    const extracted = await extractAudio(url, {start, end, channel: 'stereo'});
    const storage = getStorage();
    const fileRef = ref(storage, `sermons/${title}.mp3`);
    setUploaded(uploadBytesResumable(fileRef, extracted, {
      contentType: extracted.type,
    }));
    return extracted;
  }, [start, end, title, url]);
  const [progress, setProgress] = useState<number | true | StorageError | null>(null);
  useEffect(() => {
    if (!uploaded) return;
    setProgress(0);
    const onProgress = (snap: UploadTaskSnapshot) => {
      setProgress(snap.bytesTransferred / snap.totalBytes);
    };
    const onError = (err: StorageError) => {
      setProgress(err);
    };
    const onComplete = () => {
      setProgress(true);
    };
    return uploaded.on("state_changed", onProgress, onError, onComplete) as Unsubscribe;
  }, [uploaded]);
  const downloadBlob = () => {
    if (extracted.value == null) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(extracted.value);
    link.download = `${title}.mp3`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return (
    <Flex flexDir='column' align='center'>
      <Flex flexDir='column' m='4' p='4' w='md' minH='256px' borderWidth='1px' borderRadius='10' overflow="hidden">
        {extracted.loading ?
          <>
            <Text textAlign='center'>Extracting &amp; encoding audio clip...</Text>
            <Center flex='1'>
              <Spinner />
            </Center>
          </>
          : extracted.error ? <>
            <Text textAlign='center'>Error!</Text>
            <Center flex='1'>
              <Text size='sm'>
                Unable to encode the file, please contact support.
              </Text>
            </Center>
          </> : progress === true ? <>
            <Text textAlign='center'>Success!</Text>
            <Center flex='1'>
              <Text size='sm'>
                File successfully uploaded.
              </Text>
            </Center>
            <Button mt='4' onClick={downloadBlob}>
              Download Extracted Audio File
            </Button>
          </> : typeof progress === 'number' ? <>
            <Text textAlign='center'>Uploading to the Cloud...</Text>
            <Center flex='1'>
              <CircularProgress min={0} max={1} value={progress} />
            </Center>
            <Button mt='4' onClick={downloadBlob}>
              Download Extracted Audio File
            </Button>
          </> : <>
            <Text textAlign='center'>Error!</Text>
            <Center flex='1'>
              <Text size='sm'>
                Unable to upload file, please contact support.
              </Text>
            </Center>
            <Button mt='4' onClick={downloadBlob}>
              Download Extracted Audio File
            </Button>
          </>}
      </Flex>
    </Flex>
  );
}

