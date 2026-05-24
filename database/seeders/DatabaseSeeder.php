<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'yurmarchuk@gmail.com'],
            [
                'name' => 'Юрий Марчук',
                'password' => Hash::make('password'),
            ]
        );

        $this->call(PortfolioSeeder::class);
    }
}
