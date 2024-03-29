import {Button, Center, CircularProgress, Flex, Spinner, Text} from "@chakra-ui/react";
import {TrimmerOutput} from "./Trimmer";
import {StorageError, UploadTask, UploadTaskSnapshot, getStorage, ref, uploadBytesResumable} from "firebase/storage";
import {useAsync} from "react-use";
import {extractAudio} from "./extract";
import {useEffect, useState} from "react";
import {Unsubscribe} from "firebase/auth";


export function Uploader({start, end, title, url, date, duration}: TrimmerOutput) {
  const [uploaded, setUploaded] = useState<UploadTask | null>(null);
  const extracted = useAsync(async () => {
    const extracted = await extractAudio(url, {start, end, channel: 'mono'});
    const storage = getStorage();
    const fileRef = ref(storage, `sermons/${new Date().toISOString()}.mp3`);
    setUploaded(uploadBytesResumable(fileRef, extracted, {
      contentType: extracted.type,
      customMetadata: {
        title,
        duration: duration.toFixed(0),
        date: date.toUTCString(),
      },
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
      <Flex flexDir='column' m='4' p='4' w='calc(100% - calc(2 * var(--chakra-space-4)))' minH='256px' borderWidth='1px' borderRadius='10' overflow="hidden">
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
            <Text textAlign='center'>Uploading {extracted.value ? humanFileSize(extracted.value.size) : ''} to the Cloud...</Text>
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

/**
 * Format bytes as human-readable text.
 * 
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use 
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 * 
 * @return Formatted string.
 */
function humanFileSize(bytes: number, si = false, dp = 1): string {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


  return bytes.toFixed(dp) + ' ' + units[u];
}

