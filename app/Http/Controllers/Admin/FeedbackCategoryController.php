<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminLog;
use App\Models\Feedback;
use App\Models\FeedbackCategory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FeedbackCategoryController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:50', Rule::unique('feedback_categories', 'label')],
            'icon' => ['required', 'string', Rule::in(FeedbackCategory::iconOptions())],
        ]);

        $category = FeedbackCategory::create($validated);

        AdminLog::log('category.created', "Created feedback category \"{$category->label}\"", $category);

        return back()->with('success', 'Category created.');
    }

    /**
     * Label and icon are editable; the key is intentionally left alone so existing
     * feedback tickets already stored under it keep matching this category.
     */
    public function update(Request $request, FeedbackCategory $feedbackCategory)
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:50', Rule::unique('feedback_categories', 'label')->ignore($feedbackCategory->id)],
            'icon' => ['required', 'string', Rule::in(FeedbackCategory::iconOptions())],
        ]);

        $oldLabel = $feedbackCategory->label;
        $feedbackCategory->update($validated);

        AdminLog::log('category.updated', "Renamed feedback category \"{$oldLabel}\" to \"{$feedbackCategory->label}\"", $feedbackCategory);

        return back()->with('success', 'Category updated.');
    }

    public function destroy(FeedbackCategory $feedbackCategory)
    {
        if (Feedback::where('category', $feedbackCategory->key)->exists()) {
            return back()->withErrors(['category' => "\"{$feedbackCategory->label}\" still has feedback tickets and can't be deleted."]);
        }

        $label = $feedbackCategory->label;
        $feedbackCategory->delete();

        AdminLog::log('category.deleted', "Deleted feedback category \"{$label}\"");

        return back()->with('success', 'Category deleted.');
    }
}
