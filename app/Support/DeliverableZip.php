<?php

namespace App\Support;

use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DeliverableZip
{
    /**
     * Build a ZIP from a list of ['path' => storage-relative path on the public disk,
     * 'name' => name/path the file should have inside the archive] entries and stream
     * it back as a download. The temp file is deleted once the response finishes sending.
     */
    public static function download(array $entries, string $zipFileName): BinaryFileResponse
    {
        $zipPath = storage_path('app/tmp/' . uniqid() . '-' . $zipFileName);

        if (! is_dir(dirname($zipPath))) {
            mkdir(dirname($zipPath), 0755, true);
        }

        $zip = new \ZipArchive();
        $zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);

        foreach ($entries as $entry) {
            $fullPath = storage_path('app/public/' . $entry['path']);
            if (file_exists($fullPath)) {
                $zip->addFile($fullPath, $entry['name']);
            }
        }

        $zip->close();

        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }
}
