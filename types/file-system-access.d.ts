/**
 * Tipos da File System Access API ainda não incluídos na lib DOM do TypeScript.
 * Usados pelo backup em pasta local (Chromium/Edge). Ver:
 * https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */
export {};

interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

interface DirectoryPickerOptions {
  id?: string;
  mode?: 'read' | 'readwrite';
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
}

declare global {
  interface FileSystemDirectoryHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }

  interface Window {
    showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
  }
}
