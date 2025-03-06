# Manual Model Download Instructions

If you're having issues with the automatic model download script, follow these manual steps:

## 1. Download the Vosk model

Download one of these Vosk models (English):

- [Small English model (recommended, ~40MB)](https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip)
- [Complete English model (~1.8GB)](https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip)

## 2. Extract the model

Extract the ZIP file you downloaded.

## 3. Place the model files

Move the extracted files to the correct location:

- Create a folder named `models` in the root of the project (if it doesn't exist)
- Inside the `models` folder, create a folder named `vosk-model-en`
- Copy all files from the extracted model into the `vosk-model-en` folder

The resulting structure should look like:

```
/d:/Projects/VCTranslator/
  ├─ models/
  │   └─ vosk-model-en/
  │      ├─ README
  │      ├─ am/
  │      ├─ conf/
  │      ├─ ivector/
  │      ├─ graph/
  │      ├─ lang/
  │      ├─ final.mdl
  │      └─ ... other model files
```

## 4. Verify the model

Run the verification script to ensure the model is correctly installed:

```
npm run verify-model
```

## Still having issues?

- Check that you have extracted the entire contents of the ZIP file
- Make sure you've placed the files in the correct directory
- Check permissions on the model directory
- Try using a different model if the current one doesn't work
