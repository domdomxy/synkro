<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class FeedbackPageController extends Controller
{
    public function index()
    {
        return Inertia::render('Feedback', [
            'flash' => session()->only(['feedback_tracking_id']),
        ]);
    }
}