<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class FeedbackCategory extends Model
{
    protected $fillable = ['key', 'label', 'icon', 'sort_order'];

    /**
     * The icon presets the admin UI lets a category be assigned. Kept here (not just in the
     * frontend CategoryIcon component) so validation rejects anything the UI can't render.
     */
    public static function iconOptions(): array
    {
        return ['bug', 'help', 'flag', 'question', 'lightbulb', 'dot', 'star', 'chat', 'mail', 'alert', 'lock', 'users'];
    }

    protected static function booted(): void
    {
        static::creating(function (FeedbackCategory $category) {
            if (! $category->key) {
                $category->key = static::uniqueKeyFor($category->label);
            }
            if ($category->sort_order === null) {
                $category->sort_order = (static::max('sort_order') ?? -1) + 1;
            }
        });
    }

    /**
     * Slugifies the label into a stable key, appending -2, -3, etc. on collision.
     * The key is what feedbacks.category actually stores, so it's set once here and
     * never changed by an update (renaming the label later must not orphan existing tickets).
     */
    private static function uniqueKeyFor(string $label): string
    {
        $base = Str::slug($label, '_') ?: 'category';
        $key = $base;
        $suffix = 2;
        while (static::where('key', $key)->exists()) {
            $key = "{$base}_{$suffix}";
            $suffix++;
        }

        return $key;
    }

    public function feedbacks()
    {
        return $this->hasMany(Feedback::class, 'category', 'key');
    }
}
