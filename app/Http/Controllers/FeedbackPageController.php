<?php

namespace App\Http\Controllers;

use App\Models\FeedbackCategory;
use Inertia\Inertia;

class FeedbackPageController extends Controller
{
    public function index()
    {
        return Inertia::render('Feedback', [
            'flash' => session()->only(['feedback_tracking_id']),
            'categories' => FeedbackCategory::orderBy('sort_order')->get(['key', 'label', 'icon']),
        ]);
    }
}